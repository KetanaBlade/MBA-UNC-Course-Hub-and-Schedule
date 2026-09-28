"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Layers,
} from "lucide-react";
import {
  CanvasCalendarEvent,
  CanvasCourse,
  CanvasModule,
  DeliverableStatus,
  NormalizedDeliverable,
  NormalizedLiveSession,
  StudentAuthTokens,
  WeeklyBundle,
} from "@/lib/canvas/types";
import { CanvasApiClient } from "@/lib/canvas/client";
import { aggregateCourseIntoWeeks, getMockMBACoursesData } from "@/lib/canvas/aggregator";
import { AppStorage } from "@/lib/storage";
import { downloadICSFile, generateICalFeed } from "@/lib/calendar";
import { Navbar } from "@/components/Navbar";
import { SetupWizard } from "@/components/SetupWizard";
import { WeeklyDashboard } from "@/components/WeeklyDashboard";
import { MasterCalendarView } from "@/components/MasterCalendarView";
import { CohortShareModal } from "@/components/CohortShareModal";

export default function HomePage() {
  const [tokens, setTokens] = useState<StudentAuthTokens>({
    digitalCampusToken: "",
    kenanFlaglerToken: "",
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [bundlesByCourse, setBundlesByCourse] = useState<Record<number, WeeklyBundle[]>>({});
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"weekly" | "calendar">("weekly");

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showCohortShare, setShowCohortShare] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const savedTokens = AppStorage.getTokens();
    const demo = AppStorage.isDemoMode();
    const cachedCourses = AppStorage.getCachedCourses();
    const cachedBundles = AppStorage.getCachedBundles();
    const savedWeek = AppStorage.getSelectedWeek();

    setTokens(savedTokens);
    setIsDemoMode(demo);
    setSelectedWeek(savedWeek || 1);

    const hasAnyToken = Boolean(savedTokens.digitalCampusToken || savedTokens.kenanFlaglerToken);

    if (hasAnyToken) {
      if (cachedCourses && cachedBundles) {
        setCourses(cachedCourses);
        setBundlesByCourse(cachedBundles);
        setSelectedCourseIds(cachedCourses.map((c) => c.id));
        setIsLoading(false);
        // Re-sync with Canvas in the background to ensure calendar events are correlated
        fetchLiveData(savedTokens);
      } else {
        fetchLiveData(savedTokens);
      }
    } else if (demo) {
      loadMockData();
    } else {
      loadMockData();
      setShowSetupWizard(true);
    }
  }, []);

  const loadMockData = () => {
    const { courses: mockCourses, weeklyBundles: mockBundles } = getMockMBACoursesData();
    setCourses(mockCourses);
    setBundlesByCourse(mockBundles);
    setSelectedCourseIds(mockCourses.map((c) => c.id));
    setIsLoading(false);
  };

  const filterEventsForCourse = (
    events: CanvasCalendarEvent[],
    course: CanvasCourse,
    modules: CanvasModule[]
  ): CanvasCalendarEvent[] => {
    const courseCodeLower = (course.course_code || "").toLowerCase();
    const courseNameLower = (course.name || "").toLowerCase();
    const courseNum = course.course_code?.match(/\d{3}/)?.[0];
    const moduleItemTitles = new Set(
      modules.flatMap((m) => m.items || []).map((i) => (i.title || "").toLowerCase().trim())
    );

    return events.filter((ev) => {
      // 1. Direct course ID or effective context
      if (ev.course_id && ev.course_id === course.id) return true;
      if (ev.context_code === `course_${course.id}` || ev.effective_context_code === `course_${course.id}`) {
        return true;
      }
      if (ev.context_code?.includes(String(course.id))) {
        return true;
      }

      // 2. Context name match
      const contextName = (ev.context_name || "").toLowerCase();
      if (contextName && (contextName.includes(courseCodeLower) || contextName.includes(courseNameLower))) {
        return true;
      }
      if (courseNum && contextName.includes(courseNum)) {
        return true;
      }

      // 3. Text in title or description
      const text = `${ev.title || ""} ${ev.description || ""}`.toLowerCase();
      if (courseCodeLower && text.includes(courseCodeLower)) return true;
      if (courseNameLower && text.includes(courseNameLower)) return true;
      if (courseNum && text.includes(courseNum)) return true;

      // 4. Exact module item title match (e.g. module has "Synchronous Session 1" and calendar event is "Synchronous Session 1")
      const evTitleClean = (ev.title || "").toLowerCase().trim();
      if (evTitleClean && moduleItemTitles.has(evTitleClean)) {
        return true;
      }

      // 5. If title has "synchronous" or "live session" or "zoom"
      if (/\b(?:sync|synchronous|live\s*session|zoom)\b/i.test(evTitleClean)) {
        if (courseNum && text.includes(courseNum)) return true;
        // If event mentions course keywords
        if (courseNameLower.split(" ").some((w) => w.length > 4 && text.includes(w))) {
          return true;
        }
      }

      return false;
    });
  };

  const fetchLiveData = async (authTokens: StudentAuthTokens) => {
    setIsSyncing(true);
    setSyncError(null);

    const loadedCourses: CanvasCourse[] = [];
    const bundlesMap: Record<number, WeeklyBundle[]> = {};
    const completedItems = AppStorage.getCompletedItems();

    try {
      if (authTokens.digitalCampusToken) {
        try {
          const dcClient = new CanvasApiClient("digitalcampus", authTokens.digitalCampusToken);
          const dcCourses = await dcClient.getCourses();
          loadedCourses.push(...dcCourses);

          // Fetch all calendar events across DigitalCampus courses
          const dcCalendarEvents = await dcClient
            .getCalendarEvents(dcCourses.map((c) => c.id))
            .catch(() => []);

          for (const course of dcCourses) {
            try {
              const [modules, assignments, folders, announcements] = await Promise.all([
                dcClient.getModules(course.id).catch(() => []),
                dcClient.getAssignments(course.id).catch(() => []),
                dcClient.getFolders(course.id).catch(() => []),
                dcClient.getAnnouncements([course.id]).catch(() => []),
              ]);

              const folderFilesMap: Record<number, any[]> = {};
              for (const f of folders) {
                if (f.name.toLowerCase().includes("week") || f.name.toLowerCase().includes("read")) {
                  folderFilesMap[f.id] = await dcClient.getFolderFiles(f.id).catch(() => []);
                }
              }

              const courseCalEvents = filterEventsForCourse(dcCalendarEvents, course, modules);

              bundlesMap[course.id] = aggregateCourseIntoWeeks({
                course,
                modules,
                assignments,
                folders,
                folderFilesMap,
                announcements,
                calendarEvents: courseCalEvents,
                completedItemIds: completedItems,
              });
            } catch (err) {
              console.error(`Failed to aggregate course ${course.id}:`, err);
            }
          }
        } catch (err) {
          console.error("DigitalCampus fetch failed:", err);
        }
      }

      if (authTokens.kenanFlaglerToken) {
        try {
          const kfClient = new CanvasApiClient("kenan-flagler", authTokens.kenanFlaglerToken);
          const kfCourses = await kfClient.getCourses();
          loadedCourses.push(...kfCourses);

          // Fetch all calendar events across Kenan-Flagler courses
          const kfCalendarEvents = await kfClient
            .getCalendarEvents(kfCourses.map((c) => c.id))
            .catch(() => []);

          for (const course of kfCourses) {
            try {
              const [modules, assignments, folders, announcements] = await Promise.all([
                kfClient.getModules(course.id).catch(() => []),
                kfClient.getAssignments(course.id).catch(() => []),
                kfClient.getFolders(course.id).catch(() => []),
                kfClient.getAnnouncements([course.id]).catch(() => []),
              ]);

              const folderFilesMap: Record<number, any[]> = {};
              for (const f of folders) {
                if (f.name.toLowerCase().includes("week") || f.name.toLowerCase().includes("read")) {
                  folderFilesMap[f.id] = await kfClient.getFolderFiles(f.id).catch(() => []);
                }
              }

              const courseCalEvents = filterEventsForCourse(kfCalendarEvents, course, modules);

              bundlesMap[course.id] = aggregateCourseIntoWeeks({
                course,
                modules,
                assignments,
                folders,
                folderFilesMap,
                announcements,
                calendarEvents: courseCalEvents,
                completedItemIds: completedItems,
              });
            } catch (err) {
              console.error(`Failed to aggregate course ${course.id}:`, err);
            }
          }
        } catch (err) {
          console.error("Kenan-Flagler fetch failed:", err);
        }
      }

      if (loadedCourses.length > 0) {
        setCourses(loadedCourses);
        setBundlesByCourse(bundlesMap);
        AppStorage.saveCachedCourses(loadedCourses);
        AppStorage.saveCachedBundles(bundlesMap);
      } else {
        loadMockData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      setSyncError(msg);
      loadMockData();
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const handleSaveTokens = async (newTokens: StudentAuthTokens): Promise<boolean> => {
    let dcValid = false;
    let kfValid = false;

    if (newTokens.digitalCampusToken) {
      try {
        const client = new CanvasApiClient("digitalcampus", newTokens.digitalCampusToken);
        await client.validateToken();
        dcValid = true;
      } catch {
        dcValid = false;
      }
    }

    if (newTokens.kenanFlaglerToken) {
      try {
        const client = new CanvasApiClient("kenan-flagler", newTokens.kenanFlaglerToken);
        await client.validateToken();
        kfValid = true;
      } catch {
        kfValid = false;
      }
    }

    if (!dcValid && !kfValid) {
      return false;
    }

    AppStorage.saveTokens(newTokens);
    AppStorage.setDemoMode(false);
    setTokens(newTokens);
    setIsDemoMode(false);
    fetchLiveData(newTokens);
    return true;
  };

  const handleEnableDemoMode = () => {
    AppStorage.setDemoMode(true);
    setIsDemoMode(true);
    loadMockData();
  };

  const handleToggleCompleteItem = (itemId: string) => {
    AppStorage.toggleCompletedItem(itemId);
    setBundlesByCourse((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cId) => {
        const courseId = Number(cId);
        next[courseId] = next[courseId].map((bundle) => {
          let hasChange = false;

          // Check readings & files
          const updatedReadings = bundle.readings.map((r) => {
            if (r.id === itemId) {
              hasChange = true;
              return { ...r, isCompleted: !r.isCompleted };
            }
            return r;
          });

          // Check deliverables
          const updatedDeliverables = bundle.deliverables.map((d) => {
            if (d.id === itemId) {
              hasChange = true;
              const nextCompleted = !d.isCompleted;
              return {
                ...d,
                isCompleted: nextCompleted,
                status: (nextCompleted ? "submitted" : "unsubmitted") as DeliverableStatus,
              };
            }
            return d;
          });

          if (!hasChange) return bundle;

          const completedReadingsCount = updatedReadings.filter((r) => r.isCompleted).length;
          const submittedCount = updatedDeliverables.filter(
            (d) => d.status === "submitted" || d.status === "graded" || d.isCompleted
          ).length;

          return {
            ...bundle,
            readings: updatedReadings,
            deliverables: updatedDeliverables,
            stats: {
              ...bundle.stats,
              completedReadingsCount,
              submittedCount,
            },
          };
        });
      });
      return next;
    });
  };

  const handleExportCalendar = () => {
    const allDeliverables: NormalizedDeliverable[] = Object.values(bundlesByCourse).flatMap(
      (bundles) => bundles.flatMap((b) => b.deliverables)
    );
    const allLiveSessions: NormalizedLiveSession[] = Object.values(bundlesByCourse).flatMap(
      (bundles) => bundles.flatMap((b) => b.liveSessions)
    );

    const icsContent = generateICalFeed({
      deliverables: allDeliverables,
      liveSessions: allLiveSessions,
      calendarName: "UNC Online MBA Master Schedule",
    });

    downloadICSFile("UNC_MBA_Master_Schedule.ics", icsContent);
  };

  const allDeliverables = Object.values(bundlesByCourse).flatMap((bundles) =>
    bundles.flatMap((b) => b.deliverables)
  );
  const allLiveSessions = Object.values(bundlesByCourse).flatMap((bundles) =>
    bundles.flatMap((b) => b.liveSessions)
  );

  return (
    <div className="min-h-screen pb-16">
      {/* Executive Navbar */}
      <Navbar
        tokens={tokens}
        isDemoMode={isDemoMode}
        onOpenSettings={() => setShowSetupWizard(true)}
        onOpenCohortShare={() => setShowCohortShare(true)}
        onExportCalendar={handleExportCalendar}
        onSync={() => fetchLiveData(tokens)}
        isSyncing={isSyncing}
      />

      {/* Main Container with generous horizontal space */}
      <main className="mx-auto max-w-[1650px] px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* Page Header & Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-sans">
              Course Hub & Master Schedule
            </h1>
            <p className="text-sm font-medium text-muted-foreground font-sans">
              Unified weekly coursework, readings, and calendar across DigitalCampus & Kenan-Flagler
            </p>
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <div className="flex items-center bg-card p-1 rounded-md border border-border shadow-2xs">
              <button
                onClick={() => setActiveTab("weekly")}
                className={`px-3.5 py-1.5 rounded-sm text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "weekly"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Weekly Hub</span>
              </button>

              <button
                onClick={() => setActiveTab("calendar")}
                className={`px-3.5 py-1.5 rounded-sm text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "calendar"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Master Calendar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync or Connection Notification */}
        {syncError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive flex items-center justify-between">
            <span>{syncError}</span>
            <button
              onClick={() => setShowSetupWizard(true)}
              className="text-primary font-bold underline ml-2 cursor-pointer"
            >
              Check Tokens
            </button>
          </div>
        )}

        {/* Content View */}
        {activeTab === "weekly" ? (
          <WeeklyDashboard
            courses={courses}
            bundlesByCourse={bundlesByCourse}
            selectedCourseIds={selectedCourseIds}
            selectedWeek={selectedWeek}
            onToggleCourse={(id) => {
              setSelectedCourseIds((prev) =>
                prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
              );
            }}
            onSelectAllCourses={() => {
              setSelectedCourseIds(courses.map((c) => c.id));
            }}
            onClearAllCourses={() => {
              setSelectedCourseIds([]);
            }}
            onSelectWeek={(w) => {
              setSelectedWeek(w);
              AppStorage.setSelectedWeek(w);
            }}
            onToggleCompleteItem={handleToggleCompleteItem}
          />
        ) : (
          <MasterCalendarView
            courses={courses}
            bundlesByCourse={bundlesByCourse}
            deliverables={allDeliverables}
            liveSessions={allLiveSessions}
            onExportICS={handleExportCalendar}
            onToggleCompleteItem={handleToggleCompleteItem}
          />
        )}
      </main>

      {/* Onboarding Setup Wizard */}
      <SetupWizard
        isOpen={showSetupWizard}
        onClose={() => setShowSetupWizard(false)}
        onSaveTokens={handleSaveTokens}
        onEnableDemoMode={handleEnableDemoMode}
        initialTokens={tokens}
      />

      {/* Cohort Share Modal */}
      <CohortShareModal
        isOpen={showCohortShare}
        onClose={() => setShowCohortShare(false)}
      />
    </div>
  );
}
