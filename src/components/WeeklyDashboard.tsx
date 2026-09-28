"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Plus,
  X,
} from "lucide-react";
import { CanvasCourse, WeeklyBundle } from "@/lib/canvas/types";
import { WeeklyOverviewCard } from "./WeeklyOverviewCard";
import { ReadingsSection } from "./ReadingsSection";
import { HomeworkTracker } from "./HomeworkTracker";
import { CourseFilesCard } from "./CourseFilesCard";
import { getCourseColor, getCleanCourseCode } from "@/lib/courseColors";

interface WeeklyDashboardProps {
  courses: CanvasCourse[];
  bundlesByCourse: Record<number, WeeklyBundle[]>;
  selectedCourseIds: number[];
  selectedWeek: number;
  onToggleCourse: (courseId: number) => void;
  onSelectAllCourses: () => void;
  onClearAllCourses: () => void;
  onSelectWeek: (week: number) => void;
  onToggleCompleteItem: (itemId: string) => void;
}

export function WeeklyDashboard({
  courses,
  bundlesByCourse,
  selectedCourseIds,
  selectedWeek,
  onToggleCourse,
  onSelectAllCourses,
  onClearAllCourses,
  onSelectWeek,
  onToggleCompleteItem,
}: WeeklyDashboardProps) {
  const [onlyPending, setOnlyPending] = useState(false);
  const [mobileTab, setMobileTab] = useState<"actions" | "readings" | "files">("actions");
  const [showHiddenSection, setShowHiddenSection] = useState(false);

  // Fixed standard 5-week Kenan-Flagler quarter term
  const weekNumbers = [1, 2, 3, 4, 5];

  // Active vs Hidden courses
  const activeCourses = courses.filter((c) => selectedCourseIds.includes(c.id));
  const hiddenCourses = courses.filter((c) => !selectedCourseIds.includes(c.id));

  // Filter bundles based on active courses
  const activeBundles: WeeklyBundle[] = [];
  selectedCourseIds.forEach((courseId) => {
    const courseBundles = bundlesByCourse[courseId] || [];
    const b = courseBundles.find((item) => item.weekNumber === selectedWeek);
    if (b) activeBundles.push(b);
  });

  const allAnnouncements = activeBundles.flatMap((b) => b.announcements);
  let allReadings = activeBundles.flatMap((b) => b.readings);
  let allDeliverables = activeBundles.flatMap((b) => b.deliverables);

  if (onlyPending) {
    allReadings = allReadings.filter((r) => !r.isCompleted);
    allDeliverables = allDeliverables.filter(
      (d) => d.status !== "graded" && d.status !== "submitted" && !d.isCompleted
    );
  }

  // Separate readings into: Left Pane (Course Readings & Cases) and Right Pane (Rescued Files Tab items)
  const leftPaneReadings = allReadings.filter((r) => r.source !== "files_tab");
  const rightPaneFiles = allReadings.filter((r) => r.source === "files_tab");

  const totalDeliverablesCount = activeBundles.reduce(
    (sum, b) => sum + b.stats.totalDeliverables,
    0
  );
  const submittedDeliverablesCount = activeBundles.reduce(
    (sum, b) => sum + b.stats.submittedCount,
    0
  );
  const totalReadingsCount = activeBundles.reduce(
    (sum, b) => sum + b.stats.totalReadings,
    0
  );
  const completedReadingsCount = activeBundles.reduce(
    (sum, b) => sum + b.stats.completedReadingsCount,
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. ANCHORED FILTER & CHIP CONTROL DECK (NO CHECKBOXES, HIDE CHIPS) */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
        {/* Active Course Chips */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                Active Courses ({activeCourses.length} Visible):
              </span>
            </div>
            {hiddenCourses.length > 0 && (
              <button
                onClick={onSelectAllCourses}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Restore All ({courses.length})
              </button>
            )}
          </div>

          {/* Active Chips with subtle "Hide" (X) trigger */}
          <div className="flex flex-wrap items-center gap-2">
            {activeCourses.length === 0 ? (
              <div className="text-xs text-muted-foreground py-1">
                All courses are currently hidden.{" "}
                <button
                  onClick={onSelectAllCourses}
                  className="text-primary font-bold hover:underline"
                >
                  Show all courses
                </button>
              </div>
            ) : (
              activeCourses.map((course) => {
                const cleanCode = getCleanCourseCode(course.course_code, course.name);
                const courseColor = getCourseColor(course.course_code || course.id);

                return (
                  <span
                    key={course.id}
                    className={`font-mono text-xs font-bold uppercase pl-2.5 pr-1.5 py-1 rounded-md border inline-flex items-center gap-1.5 transition-all shadow-2xs ${courseColor.badge}`}
                  >
                    <span>{cleanCode}</span>
                    <button
                      type="button"
                      onClick={() => onToggleCourse(course.id)}
                      title={`Hide ${cleanCode}`}
                      aria-label={`Hide ${cleanCode}`}
                      className="hover:opacity-75 p-0.5 rounded cursor-pointer transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </span>
                );
              })
            )}
          </div>

          {/* Hidden Courses Collapsible Section */}
          {hiddenCourses.length > 0 && (
            <div className="pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => setShowHiddenSection(!showHiddenSection)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {showHiddenSection ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>Hidden Courses ({hiddenCourses.length})</span>
                <span className="text-[11px] opacity-70">— click to expand and restore</span>
              </button>

              {showHiddenSection && (
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 pl-5">
                  {hiddenCourses.map((course) => {
                    const cleanCode = getCleanCourseCode(course.course_code, course.name);
                    const courseColor = getCourseColor(course.course_code || course.id);
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => onToggleCourse(course.id)}
                        className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border opacity-60 hover:opacity-100 transition-all cursor-pointer ${courseColor.badge}`}
                        title={`Restore ${cleanCode}`}
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>{cleanCode}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={onSelectAllCourses}
                    className="text-xs text-primary font-bold hover:underline ml-2 cursor-pointer"
                  >
                    Restore all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border/60 pt-3 flex flex-wrap items-center justify-between gap-3">
          {/* Week Scrubber (Locked to 5 Weeks) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 hidden sm:inline">
              Week:
            </span>
            {weekNumbers.map((w) => {
              const isCurrentWeek = w === selectedWeek;
              return (
                <button
                  key={w}
                  onClick={() => onSelectWeek(w)}
                  aria-label={`Select Week ${w}`}
                  className={`h-11 min-w-[76px] px-3 rounded-md text-sm font-bold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex flex-col items-center justify-center border ${
                    isCurrentWeek
                      ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/30"
                      : "bg-card border-border hover:bg-muted/30 text-foreground"
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase tracking-wider opacity-80">
                    WEEK
                  </span>
                  <span className="text-base font-extrabold tabular-nums font-mono leading-none">
                    {w}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter: Show Incomplete Only */}
          <button
            onClick={() => setOnlyPending(!onlyPending)}
            className={`h-9 px-3 rounded-md border text-xs sm:text-sm font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 ${
              onlyPending
                ? "bg-primary/15 border-primary text-primary font-bold"
                : "bg-card border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{onlyPending ? "Showing To-Do Only" : "Show All Tasks"}</span>
          </button>
        </div>
      </div>

      {/* 2. SOLID WHITE KPI METRIC DECK (CLEAN, NO ICONS, ZERO WRAPPING) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Deliverables Metric */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
          <div className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
            Deliverables
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
            {submittedDeliverablesCount} / {totalDeliverablesCount}
          </div>
          <p className="text-xs text-muted-foreground">submitted for Week {selectedWeek}</p>
        </div>

        {/* Readings Metric */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
          <div className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
            Readings & Cases
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
            {completedReadingsCount} / {totalReadingsCount}
          </div>
          <p className="text-xs text-muted-foreground">items marked complete</p>
        </div>

        {/* Live Zoom Metric */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
          <div className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
            Live Zoom
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
            {activeBundles.flatMap((b) => b.liveSessions).length}
          </div>
          <p className="text-xs text-muted-foreground">sessions scheduled</p>
        </div>

        {/* Completion Rate Metric */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
          <div className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
            Overall Pace
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
            {totalDeliverablesCount + totalReadingsCount > 0
              ? Math.round(
                  ((submittedDeliverablesCount + completedReadingsCount) /
                    (totalDeliverablesCount + totalReadingsCount)) *
                    100
                )
              : 100}
            %
          </div>
          <p className="text-xs text-muted-foreground">term progress</p>
        </div>
      </div>

      {/* 3. MOBILE VIEWPORT TAB SWITCHER (xl:hidden) */}
      <div className="xl:hidden flex items-center bg-card border border-border p-1 rounded-lg">
        <button
          onClick={() => setMobileTab("actions")}
          className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "actions"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Briefings & Tasks ({allDeliverables.length})</span>
        </button>

        <button
          onClick={() => setMobileTab("readings")}
          className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "readings"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Readings ({leftPaneReadings.length})</span>
        </button>

        <button
          onClick={() => setMobileTab("files")}
          className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "files"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Files ({rightPaneFiles.length})</span>
        </button>
      </div>

      {/* 4. THREE-COLUMN PANORAMIC LAYOUT:
             - COLUMN 1 (FAR LEFT): Briefings & Homework (Priority Actions)
             - COLUMN 2 (CENTER): Course Readings & Cases (Primary Study)
             - COLUMN 3 (FAR RIGHT): Course Files & Documents (Reference Assets)
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: Priority Actions (Briefings, Zoom & Homework) -> FAR LEFT (xl:col-span-3) */}
        <div
          className={`xl:col-span-3 md:col-span-2 space-y-6 ${
            mobileTab === "actions" ? "block" : "hidden xl:block"
          }`}
        >
          <WeeklyOverviewCard
            announcements={allAnnouncements}
            weekNumber={selectedWeek}
          />

          <HomeworkTracker
            deliverables={allDeliverables}
            weekNumber={selectedWeek}
            onToggleComplete={onToggleCompleteItem}
          />
        </div>

        {/* COLUMN 2: Course Readings & Cases Checklist -> CENTER (xl:col-span-5) */}
        <div
          className={`xl:col-span-5 md:col-span-1 ${
            mobileTab === "readings" ? "block" : "hidden xl:block"
          }`}
        >
          <ReadingsSection
            readings={leftPaneReadings}
            weekNumber={selectedWeek}
            onToggleComplete={onToggleCompleteItem}
          />
        </div>

        {/* COLUMN 3: Course Files & Supplemental Models -> FAR RIGHT (xl:col-span-4) */}
        <div
          className={`xl:col-span-4 md:col-span-1 ${
            mobileTab === "files" ? "block" : "hidden xl:block"
          }`}
        >
          <CourseFilesCard
            files={rightPaneFiles}
            weekNumber={selectedWeek}
            onToggleComplete={onToggleCompleteItem}
          />
        </div>
      </div>
    </div>
  );
}
