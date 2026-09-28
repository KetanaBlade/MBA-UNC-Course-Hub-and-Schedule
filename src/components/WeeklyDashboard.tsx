"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Square,
} from "lucide-react";
import { CanvasCourse, WeeklyBundle } from "@/lib/canvas/types";
import { WeeklyOverviewCard } from "./WeeklyOverviewCard";
import { ReadingsSection } from "./ReadingsSection";
import { HomeworkTracker } from "./HomeworkTracker";
import { CourseFilesCard } from "./CourseFilesCard";
import { getCourseColor } from "@/lib/courseColors";

interface WeeklyDashboardProps {
  courses: CanvasCourse[];
  bundlesByCourse: Record<number, WeeklyBundle[]>;
  selectedCourseIds: number[];
  selectedWeek: number;
  onToggleCourse: (courseId: number) => void;
  onSelectAllCourses: () => void;
  onClearAllCourses: () => void;
  onSelectWeek: (week: number) => void;
  onToggleCompleteReading: (readingId: string) => void;
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
  onToggleCompleteReading,
}: WeeklyDashboardProps) {
  const [onlyPending, setOnlyPending] = useState(false);
  const [mobileTab, setMobileTab] = useState<"readings" | "sidebar">("readings");

  // Fixed standard 5-week Kenan-Flagler quarter term
  const weekNumbers = [1, 2, 3, 4, 5];

  // Filter bundles based on selected course IDs (multi-select include/exclude)
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
      (d) => d.status !== "graded" && d.status !== "submitted"
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
      {/* 1. ANCHORED FILTER & MULTI-SELECT CONTROL DECK */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
        {/* Course Include/Exclude Multi-Select */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground font-sans">
                Filter Courses ({selectedCourseIds.length} of {courses.length} Active):
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSelectAllCourses}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                onClick={onClearAllCourses}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Course Chips with Checkboxes */}
          <div className="flex flex-wrap items-center gap-2">
            {courses.map((course) => {
              const isIncluded = selectedCourseIds.includes(course.id);
              const courseColor = getCourseColor(course.course_code || course.id);

              return (
                <button
                  key={course.id}
                  onClick={() => onToggleCourse(course.id)}
                  aria-pressed={isIncluded}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                    isIncluded
                      ? "bg-card border-primary text-foreground shadow-2xs ring-1 ring-primary/40 font-bold"
                      : "bg-muted/30 border-border text-muted-foreground opacity-60 hover:opacity-90"
                  }`}
                >
                  {isIncluded ? (
                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span>{course.course_code || course.name}</span>
                  <span
                    className={`font-mono text-[11px] font-bold uppercase px-1.5 py-0.2 rounded-sm border ${courseColor.badge}`}
                  >
                    {course.instance === "digitalcampus" ? "2U" : "KF"}
                  </span>
                </button>
              );
            })}
          </div>
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

      {/* 2. SOLID WHITE KPI METRIC DECK (HIGH VISIBILITY) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Deliverables Metric */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-muted-foreground">
            <span>Deliverables</span>
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
            {submittedDeliverablesCount} / {totalDeliverablesCount}
          </div>
          <p className="text-xs text-muted-foreground">submitted for Week {selectedWeek}</p>
        </div>

        {/* Readings Metric */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-muted-foreground">
            <span>Readings & Cases</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
            {completedReadingsCount} / {totalReadingsCount}
          </div>
          <p className="text-xs text-muted-foreground">items marked complete</p>
        </div>

        {/* Live Zoom Metric */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-muted-foreground">
            <span>Live Zoom</span>
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
            {activeBundles.flatMap((b) => b.liveSessions).length}
          </div>
          <p className="text-xs text-muted-foreground">sessions scheduled</p>
        </div>

        {/* Completion Rate Metric */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-muted-foreground">
            <span>Overall Pace</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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

      {/* 3. MOBILE VIEWPORT TAB SWITCHER (lg:hidden) */}
      <div className="lg:hidden flex items-center bg-card border border-border p-1 rounded-lg">
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
          onClick={() => setMobileTab("sidebar")}
          className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "sidebar"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Briefings & Tasks ({allDeliverables.length})</span>
        </button>
      </div>

      {/* 4. TWO-PANE EXECUTIVE DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Readings & Cases (lg:col-span-7) */}
        <div
          className={`lg:col-span-7 ${
            mobileTab === "sidebar" ? "hidden lg:block" : "block"
          }`}
        >
          <ReadingsSection
            readings={leftPaneReadings}
            weekNumber={selectedWeek}
            onToggleComplete={onToggleCompleteReading}
          />
        </div>

        {/* RIGHT PANE: Stacked Briefings, Homework, and Course Files (lg:col-span-5) */}
        <div
          className={`lg:col-span-5 space-y-6 ${
            mobileTab === "readings" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Stack 1: Briefings & Zoom notes */}
          <WeeklyOverviewCard
            announcements={allAnnouncements}
            weekNumber={selectedWeek}
          />

          {/* Stack 2: Homework & Deliverables */}
          <HomeworkTracker
            deliverables={allDeliverables}
            weekNumber={selectedWeek}
          />

          {/* Stack 3: Rescued Course Files Tab items */}
          <CourseFilesCard
            files={rightPaneFiles}
            weekNumber={selectedWeek}
          />
        </div>
      </div>
    </div>
  );
}
