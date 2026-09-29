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
  extractWeekNumber,
  extractZoomLinks,
  formatFileSize,
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

  // 1. Identify all detected week numbers
  const detectedWeeks = new Set<number>();

  modules.forEach((mod) => {
    const w = extractWeekNumber(mod.name);
    if (w) detectedWeeks.add(w);
    if (mod.items) {
      mod.items.forEach((item) => {
        const itemW = extractWeekNumber(item.title);
        if (itemW) detectedWeeks.add(itemW);
      });
    }
  });

  folders.forEach((f) => {
    const w = extractWeekNumber(f.name) || extractWeekNumber(f.full_name);
    if (w) detectedWeeks.add(w);
  });

  assignments.forEach((a) => {
    const w = extractWeekNumber(a.name);
    if (w) detectedWeeks.add(w);
  });

  announcements.forEach((an) => {
    const w = extractWeekNumber(an.title);
    if (w) detectedWeeks.add(w);
  });

  calendarEvents.forEach((ev) => {
    const w = extractWeekNumber(ev.title) || extractWeekNumber(ev.description);
    if (w) detectedWeeks.add(w);
  });

  // Default to standard 10-week Kenan-Flagler quarter if nothing detected
  if (detectedWeeks.size === 0) {
    for (let i = 1; i <= 10; i++) detectedWeeks.add(i);
  } else {
    // Ensure contiguous range from min to max (or at least 1..max)
    const maxWeek = Math.max(...Array.from(detectedWeeks));
    for (let i = 1; i <= Math.max(maxWeek, 8); i++) {
      detectedWeeks.add(i);
    }
  }

  const sortedWeeks = Array.from(detectedWeeks).sort((a, b) => a - b);

  // 2. Build map of folder IDs to week numbers
  const folderWeekMap = new Map<number, number>();
  folders.forEach((f) => {
    const w = extractWeekNumber(f.name) || extractWeekNumber(f.full_name);
    if (w) folderWeekMap.set(f.id, w);
  });

  // Build map of assignment IDs to week numbers from modules
  const assignmentModuleWeekMap = new Map<number, number>();
  modules.forEach((mod) => {
    const modWeek = extractWeekNumber(mod.name);
    if (mod.items) {
      mod.items.forEach((item) => {
        if ((item.type === "Assignment" || item.type === "Quiz") && item.content_id) {
          if (modWeek) {
            assignmentModuleWeekMap.set(item.content_id, modWeek);
          } else {
            const itemWeek = extractWeekNumber(item.title);
            if (itemWeek) {
              assignmentModuleWeekMap.set(item.content_id, itemWeek);
            }
          }
        }
      });
    }
  });

  // Known reference assignments with weeks to infer weeks for assignments without week in title
  const knownWeekAssignments: { week: number; time: number }[] = [];
  assignments.forEach((a) => {
    const w = assignmentModuleWeekMap.get(a.id) || extractWeekNumber(a.name);
    if (w && a.due_at) {
      const t = new Date(a.due_at).getTime();
      if (!isNaN(t)) {
        knownWeekAssignments.push({ week: w, time: t });
      }
    }
  });

  // Calculate Course-Wide Term Projects & Major Deliverables
  const courseTermDeliverables: NormalizedDeliverable[] = [];
  assignments.forEach((assignment) => {
    if (/\battendance\b/i.test(assignment.name)) return;

    const titleLower = assignment.name.toLowerCase();

    // Regular weekly homework belongs to its week tab, NOT term projects
    const isWeeklyHomeworkPattern =
      /\b(?:homework(?:\s*assignment)?|hw|problem\s*set|pset|assignment\s*\d+|quiz\s*\d+|session\s*\d+|reflection\s*journal\s*\d+)\b/i.test(
        titleLower
      ) &&
      !/\b(?:final|term|capstone|development\s*plan)\b/i.test(titleLower);

    if (isWeeklyHomeworkPattern) return;

    const isMajorKeyword =
      titleLower.includes("plan") ||
      titleLower.includes("project") ||
      titleLower.includes("paper") ||
      titleLower.includes("capstone") ||
      titleLower.includes("final") ||
      titleLower.includes("midterm") ||
      titleLower.includes("report") ||
      titleLower.includes("leadership development") ||
      titleLower.includes("term");

    if (isMajorKeyword) {
      const { dueInDays, dueInHours, status } = calculateDueUrgency(
        assignment.due_at,
        assignment.submission?.workflow_state,
        assignment.submission?.score
      );

      const isCompleted =
        status === "graded" ||
        status === "submitted" ||
        completedItemIds.has(`term-assign-${assignment.id}`) ||
        completedItemIds.has(`assign-${assignment.id}`);

      courseTermDeliverables.push({
        id: `term-assign-${assignment.id}`,
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

  // 3. Assemble each WeeklyBundle
  const bundles: WeeklyBundle[] = sortedWeeks.map((weekNum) => {
    // --- A. Announcements for this week ---
    const weekAnnouncements: NormalizedAnnouncement[] = announcements
      .filter((an) => {
        const w = extractWeekNumber(an.title);
        if (w === weekNum) return true;
        // Check if message content strongly refers to this week
        const contentMatch = an.message.toLowerCase().includes(`week ${weekNum}`);
        return contentMatch && !w;
      })
      .map((an) => {
        const zoomLinks = extractZoomLinks(an.message);
        return {
          id: `ann-${an.id}`,
          title: an.title,
          message: an.message,
          postedAt: an.posted_at,
          authorName: an.author?.display_name || "Professor",
          canvasUrl: an.html_url || `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/courses/${course.id}/announcements/${an.id}`,
          zoomUrl: zoomLinks[0],
          weekNumber: weekNum,
        };
      });

    // --- B. Readings from Modules ---
    const readings: NormalizedReading[] = [];
    const addedUrls = new Set<string>();

    const weekModules = modules.filter((m) => extractWeekNumber(m.name) === weekNum);
    weekModules.forEach((targetModule) => {
      if (targetModule && targetModule.items) {
        targetModule.items.forEach((item) => {
          // Include all actionable module items (Pages, Files, ExternalUrls, ExternalTools, Quizzes, Assignments, Discussions)
          // Skip plain section divider subheaders
          if (item.type === "SubHeader") return;

          const itemUrl = item.html_url || item.url || "";
          addedUrls.add(item.title.toLowerCase());
          const id = `mod-item-${item.id}`;

          // Correlate with assignments to extract points if this is an assignment, quiz, or question
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
            id,
            title: item.title,
            source: "module_item",
            category: categorizeResource(item.title, undefined, "module_item"),
            canvasUrl: itemUrl || (matchedAssignment?.html_url || ""),
            fileUrl: item.external_url || item.url,
            isCompleted: isCanvasCompleted || completedItemIds.has(id),
            courseCode: course.course_code,
            courseName: course.name,
            pointsPossible,
            type: item.type,
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
          // Avoid duplicate if already linked in module
          if (!addedUrls.has(file.display_name.toLowerCase())) {
            const id = `file-${file.id}`;
            readings.push({
              id,
              title: file.display_name,
              source: "files_tab",
              category: categorizeResource(file.display_name, file["content-type"]),
              fileUrl: file.url,
              canvasUrl: `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/files/${file.id}`,
              fileName: file.filename,
              fileSizeFormatted: formatFileSize(file.size),
              folderPath: f.full_name || f.name,
              isCompleted: completedItemIds.has(id),
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
      // Ensure attendance assignment is accessible in readings sequentially
      const isAttendance = /\battendance\b/i.test(assignment.name);
      if (isAttendance && !addedUrls.has(assignment.name.toLowerCase())) {
        readings.push({
          id: `assign-att-${assignment.id}`,
          title: assignment.name,
          source: "module_item",
          category: "reading",
          canvasUrl:
            assignment.html_url ||
            `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/courses/${course.id}/assignments/${assignment.id}`,
          isCompleted:
            assignment.submission?.workflow_state === "graded" ||
            assignment.submission?.workflow_state === "submitted" ||
            completedItemIds.has(`assign-att-${assignment.id}`),
          courseCode: course.course_code,
          courseName: course.name,
          pointsPossible: assignment.points_possible,
        });
      }

      let assignWeek =
        assignmentModuleWeekMap.get(assignment.id) ||
        extractWeekNumber(assignment.name);

      // Infer week from due date if not in title or module
      if (!assignWeek && assignment.due_at && knownWeekAssignments.length > 0) {
        const dueTime = new Date(assignment.due_at).getTime();
        if (!isNaN(dueTime)) {
          const ref = knownWeekAssignments[0];
          const weekDiff = Math.round((dueTime - ref.time) / (7 * 86400000));
          const inferred = ref.week + weekDiff;
          if (inferred > 0 && inferred <= 12) {
            assignWeek = inferred;
          }
        }
      }

      const isWeekMatch = assignWeek === weekNum;

      if (isWeekMatch) {
        const { dueInDays, dueInHours, status } = calculateDueUrgency(
          assignment.due_at,
          assignment.submission?.workflow_state,
          assignment.submission?.score
        );

        weekDeliverables.push({
          id: `assign-${assignment.id}`,
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
        });
      }
    });

    // --- E. Live Synchronous Sessions from Canvas Calendar (Primary Source) ---
    const liveSessions: NormalizedLiveSession[] = [];
    const addedLiveKeys = new Set<string>();

    // 1. Primary Source: Canvas Calendar Events
    if (calendarEvents && calendarEvents.length > 0) {
      calendarEvents.forEach((ev) => {
        // Exclude attendance items from Live Zoom Sessions - they are deliverables/coursework!
        if (/\battendance\b/i.test(ev.title || "")) return;
        if (/\battendance\b/i.test(ev.description || "")) return;

        // Priority 1: Match week number from title or description
        let evWeek = extractWeekNumber(ev.title) || extractWeekNumber(ev.description);

        // Priority 2: Match by date if within week due date span
        if (!evWeek && ev.start_at) {
          const evDate = new Date(ev.start_at);
          if (!isNaN(evDate.getTime())) {
            const weekDueDates = weekDeliverables
              .filter((d) => d.dueAt)
              .map((d) => new Date(d.dueAt!).getTime());
            if (weekDueDates.length > 0) {
              const minDue = Math.min(...weekDueDates);
              const maxDue = Math.max(...weekDueDates);
              const weekStart = minDue - 7 * 86400000;
              const weekEnd = maxDue + 86400000;
              if (evDate.getTime() >= weekStart && evDate.getTime() <= weekEnd) {
                evWeek = weekNum;
              }
            }
          }
        }

        // Priority 3: Fallback by calendar date offset from term start (Sep 28, 2026)
        if (!evWeek && ev.start_at) {
          const evDate = new Date(ev.start_at);
          if (!isNaN(evDate.getTime())) {
            const termStartMonday = new Date(2026, 8, 28).getTime(); // Monday Sep 28, 2026
            const diffDays = Math.floor((evDate.getTime() - termStartMonday) / 86400000);
            if (diffDays >= 0) {
              const calcWeek = Math.floor(diffDays / 7) + 1;
              if (calcWeek >= 1 && calcWeek <= 10) {
                evWeek = calcWeek;
              }
            }
          }
        }

        if (evWeek === weekNum) {
          // Extract Zoom links from location, description, or url
          const allText = `${ev.location_name || ""} ${ev.location_address || ""} ${ev.description || ""} ${ev.url || ""} ${ev.html_url || ""}`;
          const zoomUrls = extractZoomLinks(allText);
          const directZoom = [ev.location_name, ev.location_address, ev.url].find(
            (loc) => loc && /zoom\.us/i.test(loc)
          );
          let zoomUrl: string | undefined = directZoom || zoomUrls[0];

          // Fallback Zoom link from course module items or announcements if not directly in calendar event
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

          // Check meeting duration: live class sessions run for 1-2 hours.
          // Canvas assignment entries have start_at === end_at (e.g. 6:36 PM - 6:36 PM)
          const startTime = ev.start_at ? new Date(ev.start_at).getTime() : 0;
          const endTime = ev.end_at ? new Date(ev.end_at).getTime() : 0;
          const durationMinutes = (endTime - startTime) / (1000 * 60);

          // If start == end (0 min duration) and no Zoom link, it is an assignment due-date marker, NOT a live session!
          if (durationMinutes <= 5 && !zoomUrl) {
            return;
          }

          // If this event matches a course assignment title and has no zoom link and 0 duration, skip it
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
              id: `cal-live-${ev.id}`,
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

    // 2. Secondary Fallback: If no calendar events found for this week, check Module sync items
    if (liveSessions.length === 0) {
      modules.forEach((mod) => {
        const modWeek = extractWeekNumber(mod.name);
        if (mod.items) {
          mod.items.forEach((item) => {
            // NEVER treat attendance as a live zoom session
            if (/\battendance\b/i.test(item.title)) return;

            const itemWeek = extractWeekNumber(item.title) || modWeek;
            const titleLower = item.title.toLowerCase();
            const isSyncSession =
              /\b(?:sync|synchronous|live\s*session|live\s*class|zoom|virtual\s*class)\b/i.test(titleLower);

            // Consider it a live session if it has an actual zoom link or is an explicit synchronous session item!
            const zoomUrl =
              (item.external_url?.includes("zoom.us") ? item.external_url : undefined) ||
              (item.url?.includes("zoom.us") ? item.url : undefined) ||
              (item.html_url?.includes("zoom.us") ? item.html_url : undefined);

            if ((zoomUrl || isSyncSession) && (itemWeek === weekNum || modWeek === weekNum)) {
              const sessionKey = `${course.id}-${item.title}`.toLowerCase();
              if (!addedLiveKeys.has(sessionKey)) {
                addedLiveKeys.add(sessionKey);
                liveSessions.push({
                  id: `live-mod-${item.id}`,
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
              id: `live-${an.id}`,
              title: an.title.includes("Live") ? an.title : `Week ${weekNum} Live Class`,
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
      (d) => d.status === "submitted" || d.status === "graded"
    ).length;
    const completedReadingsCount = readings.filter((r) => r.isCompleted).length;

    // Module name fallback for week label
    const moduleLabel = weekModules.length > 0 ? weekModules[0].name : `Week ${weekNum}`;

    return {
      weekNumber: weekNum,
      weekLabel: moduleLabel,
      courseId: course.id,
      courseName: course.name,
      courseCode: course.course_code,
      instance: course.instance,
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
 * Allows immediate previewing and cohort testing without requiring live Canvas API tokens.
 */
export function getMockMBACoursesData(): {
  courses: CanvasCourse[];
  weeklyBundles: Record<number, WeeklyBundle[]>;
} {
  const courses: CanvasCourse[] = [
    {
      id: 701,
      name: "Financial Accounting & Reporting",
      course_code: "MBA 701",
      instance: "digitalcampus",
      workflow_state: "available",
      term: { name: "Fall 2026 Quarter 1" },
    },
    {
      id: 703,
      name: "Operations & Supply Chain Management",
      course_code: "MBA 703",
      instance: "kenan-flagler",
      workflow_state: "available",
      term: { name: "Fall 2026 Quarter 1" },
    },
    {
      id: 710,
      name: "Strategic Leadership in Organizations",
      course_code: "MBA 710",
      instance: "kenan-flagler",
      workflow_state: "available",
      term: { name: "Fall 2026 Quarter 1" },
    },
  ];

  // Helper to construct mock weeks
  const createMockWeeksForCourse = (course: CanvasCourse): WeeklyBundle[] => {
    return Array.from({ length: 8 }, (_, idx) => {
      const weekNum = idx + 1;
      const isPast = weekNum < 3;
      const isCurrent = weekNum === 3;

      let deliverables: NormalizedDeliverable[] = [];
      let readings: NormalizedReading[] = [];
      let announcements: NormalizedAnnouncement[] = [];

      if (course.course_code === "MBA 701") {
        announcements = [
          {
            id: `mock-ann-701-${weekNum}`,
            title: `Week ${weekNum} Briefing: Balance Sheets & Revenue Recognition`,
            message: `<p>Welcome to Week ${weekNum}! Please make sure to download the <strong>Midwest Electric Case</strong> from the Files folder before Tuesday's live session.</p><p>Live Zoom session link: <a href="https://unc.zoom.us/j/98421038291">https://unc.zoom.us/j/98421038291</a></p>`,
            postedAt: new Date(Date.now() - (3 - weekNum) * 7 * 86400000).toISOString(),
            authorName: "Prof. Courtney Edwards",
            canvasUrl: `https://digitalcampus.instructure.com/courses/701/announcements`,
            zoomUrl: "https://unc.zoom.us/j/98421038291",
            weekNumber: weekNum,
          },
        ];

        readings = [
          {
            id: `mock-read-701-${weekNum}-1`,
            title: `Midwest Electric Company (HBR Case 9-195-123)`,
            source: "files_tab",
            category: "case",
            fileName: `Midwest_Electric_Week_${weekNum}.pdf`,
            fileSizeFormatted: "3.2 MB",
            folderPath: `Files / Week ${weekNum} / Pre-readings`,
            canvasUrl: `https://digitalcampus.instructure.com/courses/701/files`,
            isCompleted: isPast,
            courseCode: course.course_code,
            courseName: course.name,
          },
          {
            id: `mock-read-701-${weekNum}-2`,
            title: `Chapter ${weekNum * 2 - 1}: Revenue Recognition Principles`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://digitalcampus.instructure.com/courses/701/modules`,
            isCompleted: isPast || isCurrent,
            courseCode: course.course_code,
            courseName: course.name,
          },
          {
            id: `mock-read-701-${weekNum}-q1`,
            title: `Check Your Understanding: Balance Sheet & Revenue Recognition`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://digitalcampus.instructure.com/courses/701/quizzes/1`,
            isCompleted: isPast,
            courseCode: course.course_code,
            courseName: course.name,
            pointsPossible: 5,
            type: "Quiz",
          },
          {
            id: `mock-read-701-${weekNum}-3`,
            title: `Financial Statement Modeling Template`,
            source: "files_tab",
            category: "spreadsheet",
            fileName: `Model_W${weekNum}_Template.xlsx`,
            fileSizeFormatted: "840 KB",
            folderPath: `Files / Week ${weekNum}`,
            canvasUrl: `https://digitalcampus.instructure.com/courses/701/files`,
            isCompleted: false,
            courseCode: course.course_code,
            courseName: course.name,
          },
        ];

        deliverables = [
          {
            id: `mock-hw-701-${weekNum}`,
            assignmentId: 7010 + weekNum,
            title: `Homework ${weekNum}: Statement of Cash Flows Analysis`,
            courseId: 701,
            courseName: course.name,
            courseCode: course.course_code,
            instance: "digitalcampus",
            dueAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 4 * 86400000).toISOString(),
            pointsPossible: 50,
            status: isPast ? "graded" : isCurrent ? "upcoming" : "unsubmitted",
            score: isPast ? 48 : null,
            grade: isPast ? "96%" : null,
            canvasUrl: `https://digitalcampus.instructure.com/courses/701/assignments`,
            submissionTypes: ["online_upload"],
            dueInDays: (weekNum - 3) * 7 + 4,
            dueInHours: ((weekNum - 3) * 7 + 4) * 24,
          },
        ];
      } else if (course.course_code === "MBA 703") {
        readings = [
          {
            id: `mock-read-703-${weekNum}-1`,
            title: `Process Analysis at Barilla SpA (HBR Case 9-694-046)`,
            source: "files_tab",
            category: "case",
            fileName: `Barilla_SpA_Case_W${weekNum}.pdf`,
            fileSizeFormatted: "2.8 MB",
            folderPath: `Files / Case Studies / Week ${weekNum}`,
            canvasUrl: `https://kenan-flagler.instructure.com/courses/703/files`,
            isCompleted: isPast,
            courseCode: course.course_code,
            courseName: course.name,
          },
          {
            id: `mock-read-703-${weekNum}-2`,
            title: `Operations Strategy Lecture Slides Deck`,
            source: "module_item",
            category: "slides",
            fileName: `Ops_Session_${weekNum}_Slides.pptx`,
            fileSizeFormatted: "14.5 MB",
            canvasUrl: `https://kenan-flagler.instructure.com/courses/703/modules`,
            isCompleted: isPast || isCurrent,
            courseCode: course.course_code,
            courseName: course.name,
          },
          {
            id: `mock-read-703-${weekNum}-q1`,
            title: `Concept Check: Bottleneck Capacity Calculation`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://kenan-flagler.instructure.com/courses/703/quizzes/2`,
            isCompleted: isPast,
            courseCode: course.course_code,
            courseName: course.name,
            pointsPossible: 10,
            type: "Quiz",
          },
        ];

        deliverables = [
          {
            id: `mock-hw-703-${weekNum}`,
            assignmentId: 7030 + weekNum,
            title: `Case Memo ${weekNum}: Bottleneck Identification & Little's Law`,
            courseId: 703,
            courseName: course.name,
            courseCode: course.course_code,
            instance: "kenan-flagler",
            dueAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 2 * 86400000).toISOString(),
            pointsPossible: 100,
            status: isPast ? "graded" : isCurrent ? "upcoming" : "unsubmitted",
            score: isPast ? 95 : null,
            grade: isPast ? "95%" : null,
            canvasUrl: `https://kenan-flagler.instructure.com/courses/703/assignments`,
            submissionTypes: ["online_upload"],
            dueInDays: (weekNum - 3) * 7 + 2,
            dueInHours: ((weekNum - 3) * 7 + 2) * 24,
          },
        ];
      } else {
        // MBA 710
        readings = [
          {
            id: `mock-read-710-${weekNum}-1`,
            title: `Leading High-Performing Remote Teams`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://kenan-flagler.instructure.com/courses/710/modules`,
            isCompleted: isPast || isCurrent,
            courseCode: course.course_code,
            courseName: course.name,
          },
          {
            id: `mock-read-710-${weekNum}-q1`,
            title: `Self-Assessment Question: Diagnosing Organizational Conflict`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://kenan-flagler.instructure.com/courses/710/quizzes/3`,
            isCompleted: isPast,
            courseCode: course.course_code,
            courseName: course.name,
            pointsPossible: 5,
            type: "Quiz",
          },
        ];
        deliverables = [
          {
            id: `mock-hw-710-${weekNum}`,
            assignmentId: 7100 + weekNum,
            title: `Leadership Reflection Journal ${weekNum}`,
            courseId: 710,
            courseName: course.name,
            courseCode: course.course_code,
            instance: "kenan-flagler",
            dueAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 6 * 86400000).toISOString(),
            pointsPossible: 25,
            status: isPast ? "submitted" : "upcoming",
            canvasUrl: `https://kenan-flagler.instructure.com/courses/710/assignments`,
            submissionTypes: ["online_text_entry"],
            dueInDays: (weekNum - 3) * 7 + 6,
            dueInHours: ((weekNum - 3) * 7 + 6) * 24,
          },
        ];
      }

      // Course-Wide Major Term Projects & Capstone Deliverables
      const courseTermDeliverables: NormalizedDeliverable[] = [];
      if (course.course_code === "MBA 710") {
        courseTermDeliverables.push({
          id: "mock-term-710-ldp",
          assignmentId: 7199,
          title: "Leadership Development Plan",
          courseId: 710,
          courseName: course.name,
          courseCode: course.course_code,
          instance: "kenan-flagler",
          dueAt: "2026-11-08T23:59:00.000Z",
          pointsPossible: 100,
          status: "upcoming",
          canvasUrl: "https://kenan-flagler.instructure.com/courses/710/assignments/7199",
          submissionTypes: ["online_upload"],
          dueInDays: 41,
          dueInHours: 41 * 24,
          isCompleted: false,
        });
      } else if (course.course_code === "MBA 703") {
        courseTermDeliverables.push({
          id: "mock-term-703-capstone",
          assignmentId: 7099,
          title: "Final Global Supply Chain Simulation & Memo",
          courseId: 703,
          courseName: course.name,
          courseCode: course.course_code,
          instance: "kenan-flagler",
          dueAt: "2026-11-12T23:59:00.000Z",
          pointsPossible: 150,
          status: "upcoming",
          canvasUrl: "https://kenan-flagler.instructure.com/courses/703/assignments/7099",
          submissionTypes: ["online_upload"],
          dueInDays: 45,
          dueInHours: 45 * 24,
          isCompleted: false,
        });
      } else if (course.course_code === "MBA 701") {
        courseTermDeliverables.push({
          id: "mock-term-701-valuation",
          assignmentId: 7088,
          title: "Comprehensive Corporate Valuation & DCF Model",
          courseId: 701,
          courseName: course.name,
          courseCode: course.course_code,
          instance: "digitalcampus",
          dueAt: "2026-11-15T23:59:00.000Z",
          pointsPossible: 100,
          status: "upcoming",
          canvasUrl: "https://digitalcampus.instructure.com/courses/701/assignments/7088",
          submissionTypes: ["online_upload"],
          dueInDays: 48,
          dueInHours: 48 * 24,
          isCompleted: false,
        });
      }

      return {
        weekNumber: weekNum,
        weekLabel: `Week ${weekNum}: Core Concepts & Applications`,
        courseId: course.id,
        courseName: course.name,
        courseCode: course.course_code,
        instance: course.instance,
        announcements,
        readings,
        deliverables,
        termDeliverables: courseTermDeliverables,
        liveSessions: [
          {
            id: `mock-live-${course.id}-${weekNum}`,
            title: `${course.course_code} Synchronous Session ${weekNum}`,
            courseName: course.name,
            courseCode: course.course_code,
            startAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 86400000).toISOString(),
            endAt: new Date(Date.now() + (weekNum - 3) * 7 * 86400000 + 86400000 + 5400000).toISOString(),
            zoomUrl: "https://unc.zoom.us/j/98421038291",
            location: "Zoom Online Classroom",
            canvasUrl: `https://${course.instance === "digitalcampus" ? "digitalcampus" : "kenan-flagler"}.instructure.com/calendar`,
          },
        ],
        stats: {
          totalDeliverables: deliverables.length,
          submittedCount: deliverables.filter((d) => d.status === "submitted" || d.status === "graded").length,
          totalReadings: readings.length,
          completedReadingsCount: readings.filter((r) => r.isCompleted).length,
        },
      };
    });
  };

  const weeklyBundles: Record<number, WeeklyBundle[]> = {
    701: createMockWeeksForCourse(courses[0]),
    703: createMockWeeksForCourse(courses[1]),
    710: createMockWeeksForCourse(courses[2]),
  };

  return { courses, weeklyBundles };
}
