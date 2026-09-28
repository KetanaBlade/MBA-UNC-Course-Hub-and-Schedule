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
  Sparkles,
  X,
} from "lucide-react";
import { CanvasCourse, NormalizedDeliverable, WeeklyBundle } from "@/lib/canvas/types";
import { WeeklyOverviewCard } from "./WeeklyOverviewCard";
import { ReadingsSection } from "./ReadingsSection";
import { HomeworkTracker } from "./HomeworkTracker";
import { CourseFilesCard } from "./CourseFilesCard";
import { TermMilestonesCard } from "./TermMilestonesCard";
import { getCourseColor, getCleanCourseCode, getCleanCourseName } from "@/lib/courseColors";

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
  const [mobileTab, setMobileTab] = useState<"actions" | "readings" | "files" | "milestones">("actions");
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
  const allLiveSessions = activeBundles.flatMap((b) => b.liveSessions);

  if (onlyPending) {
    allReadings = allReadings.filter((r) => !r.isCompleted);
    allDeliverables = allDeliverables.filter(
      (d) => d.status !== "graded" && d.status !== "submitted" && !d.isCompleted
    );
  }

  // Separate readings into: Left Pane (Course Readings & Cases) and Right Pane (Rescued Files Tab items)
  const leftPaneReadings = allReadings.filter((r) => r.source !== "files_tab");
  const rightPaneFiles = allReadings.filter((r) => r.source === "files_tab");

  // Extract all deliverables across all weeks of active courses to identify Term Projects / Major Milestones
  const allQuarterDeliverablesMap = new Map<string, NormalizedDeliverable>();
  selectedCourseIds.forEach((courseId) => {
    const courseBundles = bundlesByCourse[courseId] || [];
    courseBundles.forEach((bundle) => {
      bundle.deliverables.forEach((deliv) => {
        if (!allQuarterDeliverablesMap.has(deliv.id)) {
          allQuarterDeliverablesMap.set(deliv.id, deliv);
        }
      });
      if (bundle.termDeliverables) {
        bundle.termDeliverables.forEach((deliv) => {
          if (!allQuarterDeliverablesMap.has(deliv.id)) {
            allQuarterDeliverablesMap.set(deliv.id, deliv);
          }
        });
      }
    });
  });

  // Term Projects & Major Milestones (e.g. Leadership Development Plan Due Nov 8)
  const termMilestones = Array.from(allQuarterDeliverablesMap.values()).filter((d) => {
    if (onlyPending && (d.isCompleted || d.status === "graded" || d.status === "submitted")) {
      return false;
    }

    const titleLower = d.title.toLowerCase();

    // Regular weekly homework belongs to its week tab, NOT term projects
    const isWeeklyHomeworkPattern =
      /\b(?:homework(?:\s*assignment)?|hw|problem\s*set|pset|assignment\s*\d+|quiz\s*\d+|session\s*\d+|reflection\s*journal\s*\d+|weekly)\b/i.test(
        titleLower
      ) &&
      !/\b(?:final|term|capstone|development\s*plan)\b/i.test(titleLower);

    if (isWeeklyHomeworkPattern) {
      return false;
    }

    // Milestone heuristics: keywords for term projects
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

    return isMajorKeyword;
  });

  // Sort chronologically by due date
  termMilestones.sort((a, b) => {
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

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
      {/* 2-COLUMN PANORAMIC LAYOUT (items-start):
             - LEFT COLUMN (xl:col-span-8): Filters, KPIs, Weekly Briefings, Homework & Coursework
             - RIGHT COLUMN (xl:col-span-4): Term Milestones Card & Course Files Card
          Both columns flow naturally and independently with zero artificial gaps.
      */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PRIMARY COLUMN (xl:col-span-8): Filters -> KPIs -> (Briefings/Homework + Coursework) */}
        <div className="xl:col-span-8 space-y-6">
          {/* A. ANCHORED FILTER & CHIP CONTROL DECK (NO CHECKBOXES, HIDE CHIPS) */}
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
                    const cleanName = getCleanCourseName(course.course_code, course.name);
                    const courseColor = getCourseColor(course.course_code || course.id);

                    return (
                      <span
                        key={course.id}
                        className={`text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-md border inline-flex items-center gap-1.5 transition-all shadow-2xs ${courseColor.badge}`}
                      >
                        <span className="font-mono font-bold uppercase">{cleanCode}</span>
                        <span className="opacity-40">•</span>
                        <span className="font-medium truncate max-w-[160px] sm:max-w-[220px]">{cleanName}</span>
                        <button
                          type="button"
                          onClick={() => onToggleCourse(course.id)}
                          title={`Hide ${cleanCode} ${cleanName}`}
                          aria-label={`Hide ${cleanCode} ${cleanName}`}
                          className="hover:opacity-75 p-0.5 rounded cursor-pointer transition-opacity ml-0.5"
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
                        const cleanName = getCleanCourseName(course.course_code, course.name);
                        const courseColor = getCourseColor(course.course_code || course.id);

                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => onToggleCourse(course.id)}
                            title={`Unhide ${cleanCode} ${cleanName}`}
                            aria-label={`Unhide ${cleanCode} ${cleanName}`}
                            className={`text-xs font-medium pl-2 pr-2.5 py-0.5 rounded-md border border-dashed inline-flex items-center gap-1.5 opacity-60 hover:opacity-100 hover:border-solid transition-all cursor-pointer ${courseColor.badge}`}
                          >
                            <Plus className="w-3 h-3" />
                            <span className="font-mono font-bold uppercase">{cleanCode}</span>
                            <span className="truncate max-w-[140px]">{cleanName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Week Selector Scrubber & Global Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground mr-1">
                  Week:
                </span>
                {weekNumbers.map((w) => {
                  const isCurrent = w === selectedWeek;
                  return (
                    <button
                      key={w}
                      onClick={() => onSelectWeek(w)}
                      className={`h-9 min-w-[56px] px-2.5 rounded-md border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-102"
                          : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                      }`}
                      aria-label={`Select Week ${w}`}
                    >
                      <span className="text-[8px] font-mono uppercase tracking-wider opacity-80">
                        Week
                      </span>
                      <span className="text-sm font-extrabold leading-none">{w}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Filter Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyPending(!onlyPending)}
                  className={`h-9 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    onlyPending
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-foreground hover:bg-muted/30 border-border"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{onlyPending ? "Showing To-Do Only" : "Show All Tasks"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* B. KPI METRIC CARDS DECK (4 SOLID METRICS - Directly below Filter Deck, NO gap!) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Deliverables Metric */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
              <div className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                Deliverables
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
                {submittedDeliverablesCount} / {totalDeliverablesCount}
              </div>
              <p className="text-xs text-muted-foreground">Submitted for Week {selectedWeek}</p>
            </div>

            {/* Coursework & Lectures Metric */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
              <div className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                Coursework & Lectures
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
                {completedReadingsCount} / {totalReadingsCount}
              </div>
              <p className="text-xs text-muted-foreground">Completed for Week {selectedWeek}</p>
            </div>

            {/* Live Zoom Class Count */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
              <div className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                Live Zoom
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-foreground">
                {allLiveSessions.length}
              </div>
              <p className="text-xs text-muted-foreground">Sessions scheduled</p>
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
              <p className="text-xs text-muted-foreground">Term progress</p>
            </div>
          </div>

          {/* C. MOBILE VIEWPORT TAB SWITCHER (xl:hidden) */}
          <div className="xl:hidden flex items-center bg-card border border-border p-1 rounded-lg">
            <button
              onClick={() => setMobileTab("actions")}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === "actions"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Briefings & Tasks ({allDeliverables.length})</span>
            </button>

            <button
              onClick={() => setMobileTab("readings")}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === "readings"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Readings ({leftPaneReadings.length})</span>
            </button>

            <button
              onClick={() => setMobileTab("files")}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === "files"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Files ({rightPaneFiles.length})</span>
            </button>

            <button
              onClick={() => setMobileTab("milestones")}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === "milestones"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Term ({termMilestones.length})</span>
            </button>
          </div>

          {/* D. WEEKLY STUDY CONTENT (Briefings & Homework + Course Readings & Cases) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6 items-start">
            {/* SUB-COLUMN 1: Priority Actions (Briefings, Zoom & Homework) -> (lg:col-span-3) */}
            <div
              className={`lg:col-span-3 space-y-6 ${
                mobileTab === "actions" ? "block" : "hidden xl:block"
              }`}
            >
              <WeeklyOverviewCard
                announcements={allAnnouncements}
                weekNumber={selectedWeek}
              />

              <HomeworkTracker
                deliverables={allDeliverables}
                liveSessions={allLiveSessions}
                weekNumber={selectedWeek}
                onToggleComplete={onToggleCompleteItem}
              />
            </div>

            {/* SUB-COLUMN 2: Course Readings & Cases Checklist -> (lg:col-span-5) */}
            <div
              className={`lg:col-span-5 ${
                mobileTab === "readings" ? "block" : "hidden xl:block"
              }`}
            >
              <ReadingsSection
                readings={leftPaneReadings}
                weekNumber={selectedWeek}
                onToggleComplete={onToggleCompleteItem}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SECONDARY COLUMN (xl:col-span-4): Term Milestones Card & Course Files Card */}
        <div className="xl:col-span-4 space-y-6 flex flex-col">
          {/* 1. Dedicated Term Projects & Major Milestones Card */}
          <div className={mobileTab === "milestones" ? "block" : "hidden xl:block"}>
            <TermMilestonesCard
              deliverables={termMilestones}
              onToggleComplete={onToggleCompleteItem}
            />
          </div>

          {/* 2. Course Files & Supplemental Models */}
          <div className={mobileTab === "files" ? "block" : "hidden xl:block"}>
            <CourseFilesCard
              files={rightPaneFiles}
              weekNumber={selectedWeek}
              onToggleComplete={onToggleCompleteItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
