import {
  CanvasAnnouncement,
  CanvasAssignment,
  CanvasCalendarEvent,
  CanvasCourse,
  CanvasFile,
  CanvasFolder,
  CanvasModule,
  NormalizedAnnouncement,
  NormalizedDeliverable,
  NormalizedLiveSession,
  NormalizedReading,
  WeeklyBundle,
} from "./types";
import {
  calculateDueUrgency,
  categorizeResource,
  classifyCourseBlock,
  extractWeekNumber,
  extractZoomLinks,
  findTermAnchorMonday,
  formatFileSize,
  getWeekFromDate,
  getWeekDateBounds,
  isDateInWeek,
  isMajorTermMilestone,
} from "./heuristics";

export interface AggregatorInput {
  course: CanvasCourse;
  modules: CanvasModule[];
  assignments: CanvasAssignment[];
  folders: CanvasFolder[];
  folderFilesMap: Record<number, CanvasFile[]>; // folderId -> files
  announcements: CanvasAnnouncement[];
  calendarEvents?: CanvasCalendarEvent[];
  completedItemIds?: Set<string>;
}

export function aggregateCourseIntoWeeks(input: AggregatorInput): WeeklyBundle[] {
  const {
    course,
    modules,
    assignments,
    folders,
    folderFilesMap,
    announcements,
    calendarEvents = [],
    completedItemIds = new Set<string>(),
  } = input;

  const idPrefix = `${course.instance || "digitalcampus"}-${course.id}`;

  // 0. Dynamically calculate the term anchor Monday from task dates & classify course block
  const allTaskDates = [
    ...(course.start_at ? [course.start_at] : []),
    ...(course.term?.start_at ? [course.term.start_at] : []),
    ...assignments.map((a) => a.due_at),
    ...calendarEvents.map((ev) => ev.start_at),
  ].filter(Boolean);

  const termAnchor = findTermAnchorMonday(allTaskDates);
  course.block = classifyCourseBlock(course, allTaskDates, termAnchor);

  // 1. Determine week sequence strictly bounded by the course's academic block
  // In UNC Online MBA, courses are strictly 5 weeks long:
  // - Block 1: Weeks 1 to 5
  // - Block 2: Weeks 6 to 10
  // - Foundations & Summits: Weeks 1 to 2
  let sortedWeeks: number[] = [];
  if (course.block === "block_1") {
    sortedWeeks = [1, 2, 3, 4, 5];
  } else if (course.block === "block_2") {
    sortedWeeks = [6, 7, 8, 9, 10];
  } else if (course.block === "foundations_summit") {
    sortedWeeks = [1, 2];
  } else {
    sortedWeeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  // 2. Build map of folder IDs to week numbers
  const folderWeekMap = new Map<number, number>();
  folders.forEach((f) => {
    let w = extractWeekNumber(f.name) || extractWeekNumber(f.full_name);
    if (course.block === "block_2" && w && w >= 1 && w <= 5) {
      w += 5;
    }
    if (w) folderWeekMap.set(f.id, w);
  });

  // Build map of assignment IDs to week numbers from modules
  const assignmentModuleWeekMap = new Map<number, number>();
  modules.forEach((mod) => {
    let modWeek = extractWeekNumber(mod.name);
    if (!modWeek && /\b(?:final|exam|wrap\s*up|conclusion)\b/i.test(mod.name)) {
      modWeek = course.block === "block_2" ? 10 : 5;
    }
    if (course.block === "block_2" && modWeek && modWeek >= 1 && modWeek <= 5) {
      modWeek += 5;
    }

    if (mod.items) {
      mod.items.forEach((item) => {
        if ((item.type === "Assignment" || item.type === "Quiz") && item.content_id) {
          if (modWeek) {
            assignmentModuleWeekMap.set(item.content_id, modWeek);
          } else {
            let itemWeek = extractWeekNumber(item.title);
            if (!itemWeek && /\b(?:final|exam|wrap\s*up)\b/i.test(item.title)) {
              itemWeek = course.block === "block_2" ? 10 : 5;
            }
            if (course.block === "block_2" && itemWeek && itemWeek >= 1 && itemWeek <= 5) {
              itemWeek += 5;
            }
            if (itemWeek) {
              assignmentModuleWeekMap.set(item.content_id, itemWeek);
            }
          }
        }
      });
    }
  });

  // Calculate Course-Wide Term Projects & Major Deliverables
  const courseTermDeliverables: NormalizedDeliverable[] = [];
  assignments.forEach((assignment) => {
    if (isMajorTermMilestone(assignment.name, assignment.points_possible)) {
      const { dueInDays, dueInHours, status } = calculateDueUrgency(
        assignment.due_at,
        assignment.submission?.workflow_state,
        assignment.submission?.score
      );

      const collisionProofId = `${idPrefix}-term-assign-${assignment.id}`;
      const isCompleted =
        status === "graded" ||
        status === "submitted" ||
        completedItemIds.has(collisionProofId) ||
        completedItemIds.has(`term-assign-${assignment.id}`) ||
        completedItemIds.has(`assign-${assignment.id}`);

      courseTermDeliverables.push({
        id: collisionProofId,
        assignmentId: assignment.id,
        title: assignment.name,
        courseId: course.id,
        courseName: course.name,
        courseCode: course.course_code,
        instance: course.instance,
        dueAt: assignment.due_at || null,
        pointsPossible: assignment.points_possible || 0,
        status,
        score: assignment.submission?.score,
        grade: assignment.submission?.grade,
        canvasUrl:
          assignment.html_url ||
          `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/courses/${course.id}/assignments/${assignment.id}`,
        submissionTypes: assignment.submission_types || [],
        dueInDays,
        dueInHours,
        isCompleted,
      });
    }
  });

  // 3. Assemble each WeeklyBundle strictly according to course block boundaries
  const bundles: WeeklyBundle[] = sortedWeeks.map((weekNum) => {
    // Relative week in syllabus (1-5) vs absolute quarter week (1-10)
    const relativeWeekNum = course.block === "block_2" ? weekNum - 5 : weekNum;

    // --- A. Announcements for this week ---
    const weekAnnouncements: NormalizedAnnouncement[] = announcements
      .filter((an) => {
        let w = extractWeekNumber(an.title);
        if (course.block === "block_2" && w && w >= 1 && w <= 5) {
          w += 5;
        }
        if (w === weekNum) return true;
        const contentMatch =
          an.message.toLowerCase().includes(`week ${relativeWeekNum}`) ||
          an.message.toLowerCase().includes(`week ${weekNum}`);
        return contentMatch && !w;
      })
      .map((an) => {
        const zoomLinks = extractZoomLinks(an.message);
        return {
          id: `${idPrefix}-ann-${an.id}`,
          title: an.title,
          message: an.message,
          postedAt: an.posted_at,
          authorName: an.author?.display_name || "Professor",
          canvasUrl: an.html_url || `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/courses/${course.id}/announcements/${an.id}`,
          zoomUrl: zoomLinks[0],
          weekNumber: weekNum,
          courseCode: course.course_code,
          courseName: course.name,
        };
      });

    // --- B. Readings from Modules ---
    const readings: NormalizedReading[] = [];
    const addedUrls = new Set<string>();

    const weekModules = modules.filter((m) => {
      let w = extractWeekNumber(m.name);
      if (!w && /\b(?:final|exam|wrap\s*up|conclusion)\b/i.test(m.name)) {
        w = course.block === "block_2" ? 10 : 5;
      }
      if (course.block === "block_2" && w && w >= 1 && w <= 5) {
        w += 5;
      }
      return w === weekNum;
    });

    weekModules.forEach((targetModule) => {
      if (targetModule && targetModule.items) {
        targetModule.items.forEach((item) => {
          if (item.type === "SubHeader") return;

          const itemUrl = item.html_url || item.url || "";
          addedUrls.add(item.title.toLowerCase());
          const collisionProofId = `${idPrefix}-mod-${item.id}`;
          const legacyId = `mod-item-${item.id}`;

          let matchedAssignment: CanvasAssignment | undefined;
          if (item.content_id) {
            matchedAssignment = assignments.find((a) => a.id === item.content_id);
          }
          if (!matchedAssignment && item.title) {
            matchedAssignment = assignments.find(
              (a) => a.name.toLowerCase().trim() === item.title.toLowerCase().trim()
            );
          }

          let pointsPossible: number | undefined = matchedAssignment?.points_possible;
          if (pointsPossible === undefined && item.title) {
            const ptMatch = item.title.match(/(?:^|\(|\[|\b)(\d+)\s*(?:pts|points)(?:\)|\]|\b)/i);
            if (ptMatch && ptMatch[1]) {
              pointsPossible = parseInt(ptMatch[1], 10);
            }
          }

          const isCanvasCompleted =
            Boolean(item.completion_requirement?.completed) ||
            matchedAssignment?.submission?.workflow_state === "graded" ||
            matchedAssignment?.submission?.workflow_state === "submitted";

          readings.push({
            id: collisionProofId,
            title: item.title,
            source: "module_item",
            category: categorizeResource(item.title, undefined, "module_item"),
            canvasUrl: itemUrl || (matchedAssignment?.html_url || ""),
            fileUrl: item.external_url || item.url,
            isCompleted:
              isCanvasCompleted ||
              completedItemIds.has(collisionProofId) ||
              completedItemIds.has(legacyId),
            courseCode: course.course_code,
            courseName: course.name,
            pointsPossible,
            type: item.type,
            courseId: course.id,
            moduleId: targetModule.id,
            moduleItemId: item.id,
            instance: course.instance,
            completionRequirementType: item.completion_requirement?.type,
          });
        });
      }
    });

    // --- C. Rescued Pre-Readings from Buried Files Tab Folders ---
    folders.forEach((f) => {
      const fWeek = folderWeekMap.get(f.id);
      if (fWeek === weekNum) {
        const files = folderFilesMap[f.id] || [];
        files.forEach((file) => {
          if (!addedUrls.has(file.display_name.toLowerCase())) {
            const collisionProofId = `${idPrefix}-file-${file.id}`;
            const legacyId = `file-${file.id}`;
            readings.push({
              id: collisionProofId,
              title: file.display_name,
              source: "files_tab",
              category: categorizeResource(file.display_name, file["content-type"]),
              fileUrl: file.url,
              canvasUrl: `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/files/${file.id}`,
              fileName: file.filename,
              fileSizeFormatted: formatFileSize(file.size),
              folderPath: f.full_name || f.name,
              isCompleted:
                completedItemIds.has(collisionProofId) ||
                completedItemIds.has(legacyId),
              courseCode: course.course_code,
              courseName: course.name,
            });
            addedUrls.add(file.display_name.toLowerCase());
          }
        });
      }
    });

    // --- D. Homework & Deliverables for this week ---
    const weekDeliverables: NormalizedDeliverable[] = [];

    assignments.forEach((assignment) => {
      const isAttendance = /\battendance\b/i.test(assignment.name);
      if (isAttendance && !addedUrls.has(assignment.name.toLowerCase())) {
        const collisionProofId = `${idPrefix}-assign-att-${assignment.id}`;
        const legacyId = `assign-att-${assignment.id}`;
        readings.push({
          id: collisionProofId,
          title: assignment.name,
          source: "module_item",
          category: "reading",
          canvasUrl:
            assignment.html_url ||
            `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/courses/${course.id}/assignments/${assignment.id}`,
          isCompleted:
            assignment.submission?.workflow_state === "graded" ||
            assignment.submission?.workflow_state === "submitted" ||
            completedItemIds.has(collisionProofId) ||
            completedItemIds.has(legacyId),
          courseCode: course.course_code,
          courseName: course.name,
          pointsPossible: assignment.points_possible,
        });
      }

      let assignWeek =
        assignmentModuleWeekMap.get(assignment.id) ||
        extractWeekNumber(assignment.name);

      const isFinalAssessment =
        /\b(?:final\s*(?:exam|examination|quiz|assessment|paper|project|memo)|exam\s*2|comprehensive\s*exam)\b/i.test(
          assignment.name
        );

      if (isFinalAssessment) {
        // Final Exam strictly belongs to the concluding week of that course
        assignWeek = course.block === "block_2" ? 10 : 5;
      } else if (!assignWeek && assignment.due_at) {
        assignWeek = getWeekFromDate(assignment.due_at, termAnchor);
      }

      // Course block boundary enforcement:
      // Block 1 courses run strictly for Weeks 1 to 5. Never let tasks leak into Week 6!
      if (course.block === "block_1" && assignWeek && assignWeek > 5) {
        assignWeek = 5;
      }

      // Block 2 courses run strictly for Weeks 6 to 10.
      if (course.block === "block_2" && assignWeek) {
        if (assignWeek >= 1 && assignWeek <= 5) {
          assignWeek += 5;
        } else if (assignWeek > 10) {
          assignWeek = 10;
        }
      }

      const isWeekMatch = assignWeek === weekNum;

      if (isWeekMatch) {
        const { dueInDays, dueInHours, status } = calculateDueUrgency(
          assignment.due_at,
          assignment.submission?.workflow_state,
          assignment.submission?.score
        );

        const collisionProofId = `${idPrefix}-assign-${assignment.id}`;
        const legacyId = `assign-${assignment.id}`;

        weekDeliverables.push({
          id: collisionProofId,
          assignmentId: assignment.id,
          title: assignment.name,
          courseId: course.id,
          courseName: course.name,
          courseCode: course.course_code,
          instance: course.instance,
          dueAt: assignment.due_at || null,
          pointsPossible: assignment.points_possible || 0,
          status,
          score: assignment.submission?.score,
          grade: assignment.submission?.grade,
          canvasUrl:
            assignment.html_url ||
            `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/courses/${course.id}/assignments/${assignment.id}`,
          submissionTypes: assignment.submission_types || [],
          dueInDays,
          dueInHours,
          isCompleted:
            status === "graded" ||
            status === "submitted" ||
            completedItemIds.has(collisionProofId) ||
            completedItemIds.has(legacyId),
        });
      }
    });

    // --- E. Live Synchronous Sessions from Canvas Calendar (Primary Source) ---
    const liveSessions: NormalizedLiveSession[] = [];
    const addedLiveKeys = new Set<string>();

    if (calendarEvents && calendarEvents.length > 0) {
      calendarEvents.forEach((ev) => {
        if (/\battendance\b/i.test(ev.title || "")) return;
        if (/\battendance\b/i.test(ev.description || "")) return;

        // Check title and description first for explicit session or week number
        // e.g. "Session 5", "Live Class 5", "Week 5 Live Session", "Synchronous Session 5"
        const titleWeek =
          extractWeekNumber(ev.title) || extractWeekNumber(ev.description);

        const isFinalOrReview =
          /\b(?:final|exam\s*review|wrap\s*up|conclusion|session\s*5|class\s*5)\b/i.test(
            `${ev.title || ""} ${ev.description || ""}`
          );

        let evWeek: number | null = null;

        if (titleWeek) {
          evWeek = titleWeek;
        } else if (isFinalOrReview) {
          evWeek = course.block === "block_2" ? 10 : 5;
        } else if (ev.start_at) {
          evWeek = getWeekFromDate(ev.start_at, termAnchor);
        }

        // Course block boundary enforcement:
        // A Block 1 course CANNOT have a live session in Week 6!
        // If Session 5 or final review occurred on Monday/Tuesday after Week 5, it is part of Week 5!
        if (course.block === "block_1" && evWeek && evWeek > 5) {
          evWeek = 5;
        }

        // Block 2 courses run strictly for Weeks 6 to 10.
        if (course.block === "block_2" && evWeek) {
          if (evWeek >= 1 && evWeek <= 5) {
            evWeek += 5;
          } else if (evWeek > 10) {
            evWeek = 10;
          }
        }

        if (evWeek === weekNum) {
          const allText = `${ev.location_name || ""} ${ev.location_address || ""} ${ev.description || ""} ${ev.url || ""} ${ev.html_url || ""}`;
          const zoomUrls = extractZoomLinks(allText);
          const directZoom = [ev.location_name, ev.location_address, ev.url].find(
            (loc) => loc && /zoom\.us/i.test(loc)
          );
          let zoomUrl: string | undefined = directZoom || zoomUrls[0];

          if (!zoomUrl) {
            modules.forEach((mod) => {
              mod.items?.forEach((item) => {
                if (
                  (item.title.toLowerCase().includes("zoom") || item.title.toLowerCase().includes("synchronous")) &&
                  (item.external_url?.includes("zoom.us") || item.url?.includes("zoom.us"))
                ) {
                  zoomUrl = item.external_url || item.url;
                }
              });
            });
          }

          const startTime = ev.start_at ? new Date(ev.start_at).getTime() : 0;
          const endTime = ev.end_at ? new Date(ev.end_at).getTime() : 0;
          const durationMinutes = (endTime - startTime) / (1000 * 60);

          if (durationMinutes <= 5 && !zoomUrl) {
            return;
          }

          const isAssignmentMatch = assignments.some(
            (a) => a.name.toLowerCase().trim() === ev.title?.toLowerCase().trim()
          );
          if (isAssignmentMatch && !zoomUrl && durationMinutes <= 15) {
            return;
          }

          const sessionKey = `${course.id}-${ev.id}`.toLowerCase();
          if (!addedLiveKeys.has(sessionKey)) {
            addedLiveKeys.add(sessionKey);
            liveSessions.push({
              id: `${idPrefix}-cal-live-${ev.id}`,
              title: ev.title,
              courseName: course.name,
              courseCode: course.course_code,
              startAt: ev.start_at || new Date().toISOString(),
              endAt: ev.end_at || ev.start_at || new Date().toISOString(),
              zoomUrl,
              location: ev.location_name || ev.location_address || (zoomUrl ? "Zoom Online Classroom" : undefined),
              canvasUrl:
                ev.html_url ||
                `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/calendar?event_id=${ev.id}&include_contexts=course_${course.id}`,
            });
          }
        }
      });
    }

    // 2. Secondary Fallback: Module Sync items
    if (liveSessions.length === 0) {
      modules.forEach((mod) => {
        let modWeek = extractWeekNumber(mod.name);
        if (course.block === "block_2" && modWeek && modWeek >= 1 && modWeek <= 5) {
          modWeek += 5;
        }

        if (mod.items) {
          mod.items.forEach((item) => {
            if (/\battendance\b/i.test(item.title)) return;

            let itemWeek = extractWeekNumber(item.title) || modWeek;
            if (course.block === "block_2" && itemWeek && itemWeek >= 1 && itemWeek <= 5) {
              itemWeek += 5;
            }
            if (course.block === "block_1" && itemWeek && itemWeek > 5) {
              itemWeek = 5;
            }

            const zoomUrl =
              (item.external_url?.includes("zoom.us") ? item.external_url : undefined) ||
              (item.url?.includes("zoom.us") ? item.url : undefined) ||
              (item.html_url?.includes("zoom.us") ? item.html_url : undefined);

            // Require an actual Zoom URL: items without video links are course pages, not live sessions
            if (zoomUrl && itemWeek === weekNum) {
              const sessionKey = `${course.id}-${item.title}`.toLowerCase();
              if (!addedLiveKeys.has(sessionKey)) {
                addedLiveKeys.add(sessionKey);
                liveSessions.push({
                  id: `${idPrefix}-live-mod-${item.id}`,
                  title: item.title,
                  courseName: course.name,
                  courseCode: course.course_code,
                  startAt: new Date().toISOString(),
                  endAt: new Date().toISOString(),
                  zoomUrl,
                  canvasUrl:
                    item.html_url ||
                    item.url ||
                    `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/courses/${course.id}/modules/items/${item.id}`,
                });
              }
            }
          });
        }
      });
    }

    // 3. Tertiary Fallback: Announcements containing Zoom links
    if (liveSessions.length === 0) {
      weekAnnouncements.forEach((an) => {
        if (an.zoomUrl) {
          const sessionKey = `${course.id}-${an.title}`.toLowerCase();
          if (!addedLiveKeys.has(sessionKey)) {
            addedLiveKeys.add(sessionKey);
            liveSessions.push({
              id: `${idPrefix}-live-ann-${an.id}`,
              title: an.title.includes("Live") ? an.title : `Week ${relativeWeekNum} Live Class`,
              courseName: course.name,
              courseCode: course.course_code,
              startAt: an.postedAt,
              endAt: an.postedAt,
              zoomUrl: an.zoomUrl,
              canvasUrl: an.canvasUrl,
            });
          }
        }
      });
    }

    // --- F. Stats ---
    const submittedCount = weekDeliverables.filter(
      (d) => d.status === "submitted" || d.status === "graded" || d.isCompleted
    ).length;
    const completedReadingsCount = readings.filter((r) => r.isCompleted).length;

    const moduleLabel = weekModules.length > 0 ? weekModules[0].name : `Week ${relativeWeekNum}`;
    const { start: bundleStart, end: bundleEnd } = getWeekDateBounds(weekNum, termAnchor);

    return {
      weekNumber: weekNum,
      weekLabel: moduleLabel,
      courseId: course.id,
      courseName: course.name,
      courseCode: course.course_code,
      instance: course.instance,
      startDate: bundleStart.toISOString(),
      endDate: bundleEnd.toISOString(),
      announcements: weekAnnouncements,
      readings,
      deliverables: weekDeliverables,
      termDeliverables: courseTermDeliverables,
      liveSessions,
      stats: {
        totalDeliverables: weekDeliverables.length,
        submittedCount,
        totalReadings: readings.length,
        completedReadingsCount,
      },
    };
  });

  return bundles;
}

/**
 * High-fidelity Mock UNC MBA Demo Data
 * Refined to reflect authentic UNC Kenan-Flagler Online MBA architecture:
 * - Block 1 (Weeks 1-5): Business Statistics & Analytics (MBA 714), Leading & Managing (MBA 710)
 * - Block 2 (Weeks 6-10): Customer Value Strategies (MBA 744), Microeconomics (MBA 773)
 * - Foundations & Summits (Weeks 1-2): Kenan-Flagler Canvas Orientation & Math Foundations
 */
export function getMockMBACoursesData(): {
  courses: CanvasCourse[];
  weeklyBundles: Record<number, WeeklyBundle[]>;
} {
  const courses: CanvasCourse[] = [
    {
      id: 714,
      name: "973D MBA 714 BUSINESS STATISTICS AND ANALYTICS 2026-0926",
      course_code: "MBA 714",
      instance: "digitalcampus",
      workflow_state: "available",
      term: { name: "Fall 2026 Quarter 1" },
      block: "block_1",
    },
    {
      id: 710,
      name: "973D MBA 710 LEADING AND MANAGING 2026-0926",
      course_code: "MBA 710",
      instance: "digitalcampus",
      workflow_state: "available",
      term: { name: "Fall 2026 Quarter 1" },
      block: "block_1",
    },
    {
      id: 744,
      name: "973D MBA 744 Customer Value Strategies 2026-0926",
      course_code: "MBA 744",
      instance: "digitalcampus",
      workflow_state: "available",
      term: { name: "Fall 2026 Quarter 1" },
      block: "block_2",
    },
    {
      id: 773,
      name: "973F MBA 773 Microeconomics 2026-0926",
      course_code: "MBA 773",
      instance: "digitalcampus",
      workflow_state: "available",
      term: { name: "Fall 2026 Quarter 1" },
      block: "block_2",
    },
    {
      id: 600,
      name: "MBA Orientation & Business Math Foundations",
      course_code: "MBA 600",
      instance: "kenan-flagler",
      workflow_state: "available",
      term: { name: "Fall 2026 Orientation" },
      block: "foundations_summit",
    },
  ];

  const createMockWeeksForCourse = (course: CanvasCourse): WeeklyBundle[] => {
    const isBlock1 = course.block === "block_1";
    const isBlock2 = course.block === "block_2";
    const isFoundations = course.block === "foundations_summit";

    const weeks = isBlock1 ? [1, 2, 3, 4, 5] : isBlock2 ? [6, 7, 8, 9, 10] : [1, 2];

    return weeks.map((weekNum) => {
      const syllabusWeek = isBlock2 ? weekNum - 5 : weekNum;
      const isPast = weekNum < 3;
      const isCurrent = weekNum === 3;
      const prefix = `${course.instance}-${course.id}`;

      let deliverables: NormalizedDeliverable[] = [];
      let readings: NormalizedReading[] = [];
      let announcements: NormalizedAnnouncement[] = [];
      let liveSessions: NormalizedLiveSession[] = [];

      if (course.course_code === "MBA 714") {
        announcements = [
          {
            id: `${prefix}-ann-${weekNum}`,
            title: `Week ${syllabusWeek} Briefing: ${
              syllabusWeek === 5
                ? "Final Exam Review & Comprehensive Regression Wrap-Up"
                : "Statistical Inference & Hypothesis Testing"
            }`,
            message: `<p>Welcome to Week ${syllabusWeek}! ${
              syllabusWeek === 5
                ? "Please review the formula sheet and join our final live review session."
                : "Make sure to download the weekly data set from Files before class."
            }</p>`,
            postedAt: new Date(Date.now() - (3 - weekNum) * 7 * 86400000).toISOString(),
            authorName: "Prof. Vinayak Deshpande",
            canvasUrl: `https://digitalcampus.instructure.com/courses/714/announcements`,
            zoomUrl: "https://unc.zoom.us/j/98421038291",
            weekNumber: weekNum,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        readings = [
          {
            id: `${prefix}-mod-${weekNum}-1`,
            title: `Chapter ${syllabusWeek}: Applied Statistical Modeling & OLS`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://digitalcampus.instructure.com/courses/714/modules`,
            isCompleted: isPast || isCurrent,
            courseCode: course.course_code,
            courseName: course.name,
          },
          {
            id: `${prefix}-file-${weekNum}-2`,
            title: `Dataset: Housing & Real Estate Regressions W${syllabusWeek}`,
            source: "files_tab",
            category: "spreadsheet",
            fileName: `Housing_Model_W${syllabusWeek}.csv`,
            fileSizeFormatted: "1.2 MB",
            folderPath: `Files / Week ${syllabusWeek}`,
            canvasUrl: `https://digitalcampus.instructure.com/courses/714/files`,
            isCompleted: isPast,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        if (syllabusWeek === 5) {
          // Final Exam strictly in Week 5 (Concluding week of Block 1)
          deliverables = [
            {
              id: `${prefix}-assign-hw-5`,
              assignmentId: 7145,
              title: "Problem Set 5: Logistic Regression & Multiple Testing",
              courseId: 714,
              courseName: course.name,
              courseCode: course.course_code,
              instance: "digitalcampus",
              dueAt: new Date(Date.now() + 14 * 86400000).toISOString(),
              pointsPossible: 50,
              status: "upcoming",
              canvasUrl: `https://digitalcampus.instructure.com/courses/714/assignments`,
              submissionTypes: ["online_upload"],
              dueInDays: 14,
              dueInHours: 14 * 24,
            },
            {
              id: `${prefix}-assign-final-exam`,
              assignmentId: 7149,
              title: "Final Exam: Business Statistics & Analytics Comprehensive",
              courseId: 714,
              courseName: course.name,
              courseCode: course.course_code,
              instance: "digitalcampus",
              dueAt: new Date(Date.now() + 16 * 86400000).toISOString(),
              pointsPossible: 100,
              status: "upcoming",
              canvasUrl: `https://digitalcampus.instructure.com/courses/714/assignments`,
              submissionTypes: ["online_quiz"],
              dueInDays: 16,
              dueInHours: 16 * 24,
            },
          ];

          liveSessions = [
            {
              id: `${prefix}-live-5`,
              title: "MBA 714 Synchronous Session 5: Final Review & Exam Prep",
              courseName: course.name,
              courseCode: course.course_code,
              startAt: new Date(Date.now() + 14 * 86400000 + 86400000).toISOString(),
              endAt: new Date(Date.now() + 14 * 86400000 + 86400000 + 5400000).toISOString(),
              zoomUrl: "https://unc.zoom.us/j/98421038291",
              location: "Zoom Online Classroom",
              canvasUrl: `https://digitalcampus.instructure.com/calendar`,
            },
          ];
        } else {
          deliverables = [
            {
              id: `${prefix}-assign-${weekNum}`,
              assignmentId: 7140 + weekNum,
              title: `Problem Set ${syllabusWeek}: Hypothesis Testing & Statistical Inference`,
              courseId: 714,
              courseName: course.name,
              courseCode: course.course_code,
              instance: "digitalcampus",
              dueAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 4 * 86400000).toISOString(),
              pointsPossible: 50,
              status: isPast ? "graded" : isCurrent ? "upcoming" : "unsubmitted",
              score: isPast ? 49 : null,
              grade: isPast ? "98%" : null,
              canvasUrl: `https://digitalcampus.instructure.com/courses/714/assignments`,
              submissionTypes: ["online_upload"],
              dueInDays: (weekNum - 3) * 7 + 4,
              dueInHours: ((weekNum - 3) * 7 + 4) * 24,
            },
          ];

          liveSessions = [
            {
              id: `${prefix}-live-${weekNum}`,
              title: `MBA 714 Synchronous Session ${syllabusWeek}`,
              courseName: course.name,
              courseCode: course.course_code,
              startAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 86400000).toISOString(),
              endAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 86400000 + 5400000).toISOString(),
              zoomUrl: "https://unc.zoom.us/j/98421038291",
              location: "Zoom Online Classroom",
              canvasUrl: `https://digitalcampus.instructure.com/calendar`,
            },
          ];
        }
      } else if (course.course_code === "MBA 710") {
        announcements = [
          {
            id: `${prefix}-ann-${weekNum}`,
            title: `Week ${syllabusWeek} Leadership Overview: ${
              syllabusWeek === 5 ? "Course Synthesis & Final Exam Submission" : "High-Performance Teams"
            }`,
            message: `<p>Welcome to Week ${syllabusWeek}! ${
              syllabusWeek === 5
                ? "Final Exam case analysis is due at the end of the week."
                : "Complete your reflection journal before Thursday."
            }</p>`,
            postedAt: new Date(Date.now() - (3 - weekNum) * 7 * 86400000).toISOString(),
            authorName: "Prof. Courtney Edwards",
            canvasUrl: `https://digitalcampus.instructure.com/courses/710/announcements`,
            zoomUrl: "https://unc.zoom.us/j/98421038292",
            weekNumber: weekNum,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        readings = [
          {
            id: `${prefix}-mod-${weekNum}-1`,
            title: `Leading Organizational Transformation (HBR Case)`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://digitalcampus.instructure.com/courses/710/modules`,
            isCompleted: isPast || isCurrent,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        if (syllabusWeek === 5) {
          deliverables = [
            {
              id: `${prefix}-assign-hw-5`,
              assignmentId: 7105,
              title: "Leadership Reflection Journal 5: Executive Capstone",
              courseId: 710,
              courseName: course.name,
              courseCode: course.course_code,
              instance: "digitalcampus",
              dueAt: new Date(Date.now() + 15 * 86400000).toISOString(),
              pointsPossible: 25,
              status: "upcoming",
              canvasUrl: `https://digitalcampus.instructure.com/courses/710/assignments`,
              submissionTypes: ["online_text_entry"],
              dueInDays: 15,
              dueInHours: 15 * 24,
            },
            {
              id: `${prefix}-assign-final-exam`,
              assignmentId: 7199,
              title: "Final Exam: Organizational Leadership & Strategy Case",
              courseId: 710,
              courseName: course.name,
              courseCode: course.course_code,
              instance: "digitalcampus",
              dueAt: new Date(Date.now() + 17 * 86400000).toISOString(),
              pointsPossible: 100,
              status: "upcoming",
              canvasUrl: `https://digitalcampus.instructure.com/courses/710/assignments`,
              submissionTypes: ["online_upload"],
              dueInDays: 17,
              dueInHours: 17 * 24,
            },
          ];

          liveSessions = [
            {
              id: `${prefix}-live-5`,
              title: "MBA 710 Synchronous Session 5: Executive Wrap-Up",
              courseName: course.name,
              courseCode: course.course_code,
              startAt: new Date(Date.now() + 15 * 86400000 + 86400000).toISOString(),
              endAt: new Date(Date.now() + 15 * 86400000 + 86400000 + 5400000).toISOString(),
              zoomUrl: "https://unc.zoom.us/j/98421038292",
              location: "Zoom Online Classroom",
              canvasUrl: `https://digitalcampus.instructure.com/calendar`,
            },
          ];
        } else {
          deliverables = [
            {
              id: `${prefix}-assign-${weekNum}`,
              assignmentId: 7100 + weekNum,
              title: `Leadership Reflection Journal ${syllabusWeek}`,
              courseId: 710,
              courseName: course.name,
              courseCode: course.course_code,
              instance: "digitalcampus",
              dueAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 6 * 86400000).toISOString(),
              pointsPossible: 25,
              status: isPast ? "submitted" : "upcoming",
              canvasUrl: `https://digitalcampus.instructure.com/courses/710/assignments`,
              submissionTypes: ["online_text_entry"],
              dueInDays: (weekNum - 3) * 7 + 6,
              dueInHours: ((weekNum - 3) * 7 + 6) * 24,
            },
          ];

          liveSessions = [
            {
              id: `${prefix}-live-${weekNum}`,
              title: `MBA 710 Synchronous Session ${syllabusWeek}`,
              courseName: course.name,
              courseCode: course.course_code,
              startAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 3 * 86400000).toISOString(),
              endAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 3 * 86400000 + 5400000).toISOString(),
              zoomUrl: "https://unc.zoom.us/j/98421038292",
              location: "Zoom Online Classroom",
              canvasUrl: `https://digitalcampus.instructure.com/calendar`,
            },
          ];
        }
      } else if (course.course_code === "MBA 744") {
        // Customer Value Strategies (Block 2 - Weeks 6 to 10)
        announcements = [
          {
            id: `${prefix}-ann-${weekNum}`,
            title: `Block 2 Week ${syllabusWeek}: Customer Value Discovery & Segmentation`,
            message: `<p>Welcome to MBA 744! Please prepare the HBR Case Study for our live session.</p>`,
            postedAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000).toISOString(),
            authorName: "Prof. Valarie Zeithaml",
            canvasUrl: `https://digitalcampus.instructure.com/courses/744/announcements`,
            zoomUrl: "https://unc.zoom.us/j/98421038293",
            weekNumber: weekNum,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        readings = [
          {
            id: `${prefix}-file-${weekNum}-1`,
            title: `Customer Lifetime Value Strategy (HBR Case)`,
            source: "files_tab",
            category: "case",
            fileName: `Customer_Value_Case_W${syllabusWeek}.pdf`,
            fileSizeFormatted: "2.4 MB",
            folderPath: `Files / Week ${syllabusWeek}`,
            canvasUrl: `https://digitalcampus.instructure.com/courses/744/files`,
            isCompleted: false,
            courseCode: course.course_code,
            courseName: course.name,
          },
          {
            id: `${prefix}-mod-${weekNum}-2`,
            title: `Customer Journey Mapping & Persona Design Deck`,
            source: "module_item",
            category: "slides",
            canvasUrl: `https://digitalcampus.instructure.com/courses/744/modules`,
            isCompleted: false,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        deliverables = [
          {
            id: `${prefix}-assign-${weekNum}`,
            assignmentId: 7440 + syllabusWeek,
            title: `Case Analysis ${syllabusWeek}: Value Proposition & CLV Modeling`,
            courseId: 744,
            courseName: course.name,
            courseCode: course.course_code,
            instance: "digitalcampus",
            dueAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 4 * 86400000).toISOString(),
            pointsPossible: 50,
            status: "upcoming",
            canvasUrl: `https://digitalcampus.instructure.com/courses/744/assignments`,
            submissionTypes: ["online_upload"],
            dueInDays: (weekNum - 3) * 7 + 4,
            dueInHours: ((weekNum - 3) * 7 + 4) * 24,
          },
        ];

        liveSessions = [
          {
            id: `${prefix}-live-${weekNum}`,
            title: `MBA 744 Synchronous Session ${syllabusWeek}`,
            courseName: course.name,
            courseCode: course.course_code,
            startAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 86400000).toISOString(),
            endAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 86400000 + 5400000).toISOString(),
            zoomUrl: "https://unc.zoom.us/j/98421038293",
            location: "Zoom Online Classroom",
            canvasUrl: `https://digitalcampus.instructure.com/calendar`,
          },
        ];
      } else if (course.course_code === "MBA 773") {
        // Microeconomics (Block 2 - Weeks 6 to 10)
        announcements = [
          {
            id: `${prefix}-ann-${weekNum}`,
            title: `Block 2 Week ${syllabusWeek}: Market Equilibrium & Pricing Power`,
            message: `<p>Welcome to Microeconomics! Check the problem set before Tuesday's class.</p>`,
            postedAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000).toISOString(),
            authorName: "Prof. Christian Lundblad",
            canvasUrl: `https://digitalcampus.instructure.com/courses/773/announcements`,
            zoomUrl: "https://unc.zoom.us/j/98421038294",
            weekNumber: weekNum,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        readings = [
          {
            id: `${prefix}-mod-${weekNum}-1`,
            title: `Managerial Economics: Demand Elasticity & Monopoly Pricing`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://digitalcampus.instructure.com/courses/773/modules`,
            isCompleted: false,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        deliverables = [
          {
            id: `${prefix}-assign-${weekNum}`,
            assignmentId: 7730 + syllabusWeek,
            title: `Problem Set ${syllabusWeek}: Elasticity & Competitive Equilibrium`,
            courseId: 773,
            courseName: course.name,
            courseCode: course.course_code,
            instance: "digitalcampus",
            dueAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 5 * 86400000).toISOString(),
            pointsPossible: 50,
            status: "upcoming",
            canvasUrl: `https://digitalcampus.instructure.com/courses/773/assignments`,
            submissionTypes: ["online_upload"],
            dueInDays: (weekNum - 3) * 7 + 5,
            dueInHours: ((weekNum - 3) * 7 + 5) * 24,
          },
        ];

        liveSessions = [
          {
            id: `${prefix}-live-${weekNum}`,
            title: `MBA 773 Live Lecture ${syllabusWeek}`,
            courseName: course.name,
            courseCode: course.course_code,
            startAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 2 * 86400000).toISOString(),
            endAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 2 * 86400000 + 5400000).toISOString(),
            zoomUrl: "https://unc.zoom.us/j/98421038294",
            location: "Zoom Online Classroom",
            canvasUrl: `https://digitalcampus.instructure.com/calendar`,
          },
        ];
      } else if (course.course_code === "MBA 600") {
        readings = [
          {
            id: `${prefix}-mod-${weekNum}-1`,
            title: `Kenan-Flagler Honor Code & Academic Policies`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://kenan-flagler.instructure.com/courses/600/modules`,
            isCompleted: true,
            courseCode: course.course_code,
            courseName: course.name,
          },
          {
            id: `${prefix}-mod-${weekNum}-2`,
            title: `Excel Financial Functions & Calculus Refresher`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://kenan-flagler.instructure.com/courses/600/modules`,
            isCompleted: true,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];
      }

      // Course-Wide Major Term Projects & Capstone Deliverables
      const courseTermDeliverables: NormalizedDeliverable[] = [];
      if (course.course_code === "MBA 710") {
        courseTermDeliverables.push({
          id: `${prefix}-term-assign-ldp`,
          assignmentId: 7199,
          title: "Leadership Development Plan (LDP Capstone)",
          courseId: 710,
          courseName: course.name,
          courseCode: course.course_code,
          instance: "digitalcampus",
          dueAt: "2026-11-01T23:59:00.000Z",
          pointsPossible: 100,
          status: "upcoming",
          canvasUrl: "https://digitalcampus.instructure.com/courses/710/assignments/7199",
          submissionTypes: ["online_upload"],
          dueInDays: 34,
          dueInHours: 34 * 24,
          isCompleted: false,
        });
      } else if (course.course_code === "MBA 744") {
        courseTermDeliverables.push({
          id: `${prefix}-term-assign-marketing-plan`,
          assignmentId: 7449,
          title: "Comprehensive Strategic Customer Value Plan",
          courseId: 744,
          courseName: course.name,
          courseCode: course.course_code,
          instance: "digitalcampus",
          dueAt: "2026-12-06T23:59:00.000Z",
          pointsPossible: 150,
          status: "upcoming",
          canvasUrl: "https://digitalcampus.instructure.com/courses/744/assignments/7449",
          submissionTypes: ["online_upload"],
          dueInDays: 69,
          dueInHours: 69 * 24,
          isCompleted: false,
        });
      }

      const { start: mockStart, end: mockEnd } = getWeekDateBounds(weekNum);

      return {
        weekNumber: weekNum,
        weekLabel: `Week ${syllabusWeek}: Core Applications`,
        courseId: course.id,
        courseName: course.name,
        courseCode: course.course_code,
        instance: course.instance,
        startDate: mockStart.toISOString(),
        endDate: mockEnd.toISOString(),
        announcements,
        readings,
        deliverables,
        termDeliverables: courseTermDeliverables,
        liveSessions,
        stats: {
          totalDeliverables: deliverables.length,
          submittedCount: deliverables.filter((d) => d.status === "submitted" || d.status === "graded" || d.isCompleted).length,
          totalReadings: readings.length,
          completedReadingsCount: readings.filter((r) => r.isCompleted).length,
        },
      };
    });
  };

  const weeklyBundles: Record<number, WeeklyBundle[]> = {
    714: createMockWeeksForCourse(courses[0]),
    710: createMockWeeksForCourse(courses[1]),
    744: createMockWeeksForCourse(courses[2]),
    773: createMockWeeksForCourse(courses[3]),
    600: createMockWeeksForCourse(courses[4]),
  };

  return { courses, weeklyBundles };
}
