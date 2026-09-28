import {
  CanvasAnnouncement,
  CanvasAssignment,
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
    completedItemIds = new Set<string>(),
  } = input;

  // 1. Identify all detected week numbers
  const detectedWeeks = new Set<number>();

  modules.forEach((mod) => {
    const w = extractWeekNumber(mod.name);
    if (w) detectedWeeks.add(w);
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

    const targetModule = modules.find((m) => extractWeekNumber(m.name) === weekNum);
    if (targetModule && targetModule.items) {
      targetModule.items.forEach((item) => {
        if (item.type === "File" || item.type === "Page" || item.type === "ExternalUrl") {
          const itemUrl = item.html_url || item.url || "";
          addedUrls.add(item.title.toLowerCase());
          const id = `mod-item-${item.id}`;

          readings.push({
            id,
            title: item.title,
            source: "module_item",
            category: categorizeResource(item.title),
            canvasUrl: itemUrl,
            fileUrl: item.external_url || item.url,
            isCompleted: completedItemIds.has(id),
          });
        }
      });
    }

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
            });
            addedUrls.add(file.display_name.toLowerCase());
          }
        });
      }
    });

    // --- D. Homework & Deliverables for this week ---
    const weekDeliverables: NormalizedDeliverable[] = [];

    assignments.forEach((assignment) => {
      const assignWeek = extractWeekNumber(assignment.name);
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

    // --- E. Live Zoom Sessions ---
    const liveSessions: NormalizedLiveSession[] = [];
    weekAnnouncements.forEach((an) => {
      if (an.zoomUrl) {
        liveSessions.push({
          id: `live-${an.id}`,
          title: `Week ${weekNum} Live Class`,
          courseName: course.name,
          courseCode: course.course_code,
          startAt: an.postedAt,
          endAt: an.postedAt,
          zoomUrl: an.zoomUrl,
          canvasUrl: an.canvasUrl,
        });
      }
    });

    // --- F. Stats ---
    const submittedCount = weekDeliverables.filter(
      (d) => d.status === "submitted" || d.status === "graded"
    ).length;
    const completedReadingsCount = readings.filter((r) => r.isCompleted).length;

    // Module name fallback for week label
    const moduleLabel = targetModule ? targetModule.name : `Week ${weekNum}`;

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
          },
          {
            id: `mock-read-701-${weekNum}-2`,
            title: `Chapter ${weekNum * 2 - 1}: Revenue Recognition Principles`,
            source: "module_item",
            category: "reading",
            canvasUrl: `https://digitalcampus.instructure.com/courses/701/modules`,
            isCompleted: isPast || isCurrent,
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
        liveSessions: announcements[0]?.zoomUrl
          ? [
              {
                id: `mock-live-${course.id}-${weekNum}`,
                title: `${course.course_code} Live Sync Session`,
                courseName: course.name,
                courseCode: course.course_code,
                startAt: new Date(Date.now() + 86400000).toISOString(),
                endAt: new Date(Date.now() + 86400000 + 5400000).toISOString(),
                zoomUrl: announcements[0].zoomUrl,
                canvasUrl: announcements[0].canvasUrl,
              },
            ]
          : [],
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
