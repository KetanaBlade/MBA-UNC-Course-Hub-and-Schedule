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
          if (
            item.type === "File" ||
            item.type === "Page" ||
            item.type === "ExternalUrl" ||
            item.type === "ExternalTool"
          ) {
            const itemUrl = item.html_url || item.url || "";
            addedUrls.add(item.title.toLowerCase());
            const id = `mod-item-${item.id}`;

            const isCanvasCompleted = Boolean(item.completion_requirement?.completed);
            readings.push({
              id,
              title: item.title,
              source: "module_item",
              category: categorizeResource(item.title, undefined, "module_item"),
              canvasUrl: itemUrl,
              fileUrl: item.external_url || item.url,
              isCompleted: isCanvasCompleted || completedItemIds.has(id),
              courseCode: course.course_code,
              courseName: course.name,
            });
          }
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
      // Move attendance tracking items to coursework readings instead of homework deliverables
      const isAttendance = /\battendance\b/i.test(assignment.name);
      if (isAttendance) {
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
        });
        return;
      }

      const assignWeek =
        assignmentModuleWeekMap.get(assignment.id) ||
        extractWeekNumber(assignment.name);
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
            const itemWeek = extractWeekNumber(item.title) || modWeek;
            const titleLower = item.title.toLowerCase();
            const isSyncSession =
              /\b(?:sync|synchronous|live\s*session|live\s*class|zoom|virtual\s*class)\b/i.test(titleLower) ||
              Boolean(item.external_url?.includes("zoom.us"));

            if (isSyncSession && (itemWeek === weekNum || modWeek === weekNum)) {
              const zoomUrl =
                item.external_url ||
                (item.url?.includes("zoom.us") ? item.url : undefined) ||
                (item.html_url?.includes("zoom.us") ? item.html_url : undefined);

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
