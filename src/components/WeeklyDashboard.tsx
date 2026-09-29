"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { CanvasCourse, NormalizedDeliverable, WeeklyBundle } from "@/lib/canvas/types";
import { getWeekDateBounds, isMajorTermMilestone } from "@/lib/canvas/heuristics";
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
  onSelectCourseIds?: (courseIds: number[]) => void;
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
  onSelectCourseIds,
  onSelectWeek,
  onToggleCompleteItem,
}: WeeklyDashboardProps) {
  const [mobileTab, setMobileTab] = useState<"actions" | "readings" | "files" | "milestones">("actions");
  const [showHiddenSection, setShowHiddenSection] = useState(false);

  // UNC Kenan-Flagler quarter term: Block 1 (Weeks 1-5) and Block 2 (Weeks 6-10)
  const block1Weeks = [1, 2, 3, 4, 5];
  const block2Weeks = [6, 7, 8, 9, 10];
  const currentBlock = selectedWeek <= 5 ? 1 : 2;
  const blockWeekNum = selectedWeek <= 5 ? selectedWeek : selectedWeek - 5;

  // Academic Block Course Groupings
  const block1Courses = courses.filter((c) => c.block === "block_1");
  const block2Courses = courses.filter((c) => c.block === "block_2");
  const foundationsCourses = courses.filter((c) => c.block === "foundations_summit");
  const otherBlockNum = currentBlock === 1 ? 2 : 1;
  const otherBlockCourses = currentBlock === 1 ? block2Courses : block1Courses;

  // Active vs Hidden courses
  const activeCourses = courses.filter((c) => selectedCourseIds.includes(c.id));
  const hiddenCourses = courses.filter((c) => !selectedCourseIds.includes(c.id));

  // Inactive courses categorized for clean opt-in
  const inactiveOtherBlock = otherBlockCourses.filter((c) => !selectedCourseIds.includes(c.id));
  const inactiveFoundations = foundationsCourses.filter((c) => !selectedCourseIds.includes(c.id));
  const inactiveCurrentBlock = (currentBlock === 1 ? block1Courses : block2Courses).filter(
    (c) => !selectedCourseIds.includes(c.id)
  );

  const handleSelectBlock = (block: "block_1" | "block_2") => {
    const targetCourses = courses.filter(
      (c) => c.block === block || c.block === "full_term" || (!c.block && block === "block_1")
    );
    const targetIds = targetCourses.map((c) => c.id);
    if (onSelectCourseIds) {
      onSelectCourseIds(targetIds);
    } else {
      targetCourses.forEach((c) => {
        if (!selectedCourseIds.includes(c.id)) onToggleCourse(c.id);
      });
    }
  };

  const handleWeekClick = (w: number) => {
    onSelectWeek(w);
    const targetBlock = w <= 5 ? "block_1" : "block_2";
    const prevBlock = selectedWeek <= 5 ? "block_1" : "block_2";
    // If student shifts blocks and currently active courses belong exclusively to the previous block, auto-switch to target block
    if (targetBlock !== prevBlock && onSelectCourseIds) {
      const allBelongToPrevBlock =
        activeCourses.length > 0 && activeCourses.every((c) => c.block === prevBlock);
      if (allBelongToPrevBlock) {
        const targetIds = courses
          .filter((c) => c.block === targetBlock || c.block === "full_term")
          .map((c) => c.id);
        if (targetIds.length > 0) {
          onSelectCourseIds(targetIds);
        }
      }
    }
  };

  // Filter bundles based on active courses
  const activeBundles: WeeklyBundle[] = [];
  selectedCourseIds.forEach((courseId) => {
    const courseBundles = bundlesByCourse[courseId] || [];
    const b = courseBundles.find((item) => item.weekNumber === selectedWeek);
    if (b) activeBundles.push(b);
  });

  const allAnnouncements = activeBundles.flatMap((b) => b.announcements);
  const allReadings = activeBundles.flatMap((b) => b.readings);
  const allDeliverables = activeBundles.flatMap((b) => b.deliverables);
  const allLiveSessions = activeBundles.flatMap((b) => b.liveSessions);

  // Separate readings into: Left Pane (Course Readings & Cases) and Right Pane (Rescued Files Tab items)
  const leftPaneReadings = allReadings.filter((r) => r.source !== "files_tab");
  const rightPaneFiles = allReadings.filter((r) => r.source === "files_tab");

  // Extract all deliverables across all weeks of active courses to identify Term Projects / Major Milestones
  const allQuarterDeliverablesMap = new Map<string, NormalizedDeliverable>();
  selectedCourseIds.forEach((courseId) => {
    const courseBundles = bundlesByCourse[courseId] || [];
    courseBundles.forEach((bundle) => {
      if (bundle.termDeliverables) {
        bundle.termDeliverables.forEach((deliv) => {
          const key = deliv.assignmentId
            ? `${deliv.courseId || courseId}-assign-${deliv.assignmentId}`
            : `${deliv.courseId || courseId}-${deliv.title.toLowerCase().trim()}`;
          if (!allQuarterDeliverablesMap.has(key)) {
            allQuarterDeliverablesMap.set(key, deliv);
          }
        });
      }
      bundle.deliverables.forEach((deliv) => {
        const key = deliv.assignmentId
          ? `${deliv.courseId || courseId}-assign-${deliv.assignmentId}`
          : `${deliv.courseId || courseId}-${deliv.title.toLowerCase().trim()}`;
        if (!allQuarterDeliverablesMap.has(key)) {
          allQuarterDeliverablesMap.set(key, deliv);
        }
      });
    });
  });

  // Major Term Milestones strictly using pure heuristic
  const termMilestones = Array.from(allQuarterDeliverablesMap.values()).filter((d) =>
    isMajorTermMilestone(d.title, d.pointsPossible)
  );

  // Sort chronologically by due date
  termMilestones.sort((a, b) => {
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

  // Date bounds for selected week, dynamically derived from active course bundles
  const activeWeekBundle = activeBundles.find((b) => b.startDate && b.endDate);
  const weekStartDate = activeWeekBundle?.startDate
    ? new Date(activeWeekBundle.startDate)
    : getWeekDateBounds(selectedWeek).start;
  const weekEndDate = activeWeekBundle?.endDate
    ? new Date(activeWeekBundle.endDate)
    : getWeekDateBounds(selectedWeek).end;
  const weekStartStr = weekStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekEndStr = weekEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekDateRangeLabel = `${weekStartStr} – ${weekEndStr}`;

  const totalDeliverablesCount = activeBundles.reduce(
    (sum, b) => sum + b.stats.totalDeliverables,
    0
  );
  const submittedDeliverablesCount = activeBundles.reduce(
    (sum, b) => sum + b.stats.submittedCount,
    0
  );

  // Separate coursework vs files counts for transparent weekly tracking
  const rawReadings = activeBundles.flatMap((b) => b.readings);
  const totalCourseworkCount = rawReadings.filter((r) => r.source !== "files_tab").length;
  const completedCourseworkCount = rawReadings.filter(
    (r) => r.source !== "files_tab" && r.isCompleted
  ).length;

  const totalFilesCount = rawReadings.filter((r) => r.source === "files_tab").length;
  const completedFilesCount = rawReadings.filter(
    (r) => r.source === "files_tab" && r.isCompleted
  ).length;

  // Overall progress strictly scoped to this selected week
  const totalWeekTasks = totalDeliverablesCount + totalCourseworkCount + totalFilesCount;
  const completedWeekTasks = submittedDeliverablesCount + completedCourseworkCount + completedFilesCount;
  const weekProgressPercent = totalWeekTasks > 0 ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* 2-COLUMN PANORAMIC LAYOUT (items-start):
             - LEFT COLUMN (xl:col-span-8): Filters, KPIs, Weekly Briefings, Homework & Coursework
             - RIGHT COLUMN (xl:col-span-4): Term Milestones Card & Course Files Card
      */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PRIMARY COLUMN (xl:col-span-8): Filters -> KPIs -> (Briefings/Homework + Coursework) */}
        <div className="xl:col-span-8 space-y-6">
          {/* A. ANCHORED FILTER & CHIP CONTROL DECK WITH BLOCK PRESETS */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
            {/* Active Course Chips & Block Presets */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    Active Courses ({activeCourses.length} Visible):
                  </span>
                  {/* Quick Block Presets */}
                  <div className="flex items-center gap-1.5 sm:ml-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSelectBlock("block_1")}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-all cursor-pointer ${
                        currentBlock === 1 &&
                        activeCourses.length > 0 &&
                        activeCourses.every((c) => c.block === "block_1" || c.block === "full_term")
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border"
                      }`}
                    >
                      Block 1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectBlock("block_2")}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-all cursor-pointer ${
                        currentBlock === 2 &&
                        activeCourses.length > 0 &&
                        activeCourses.every((c) => c.block === "block_2" || c.block === "full_term")
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border"
                      }`}
                    >
                      Block 2
                    </button>
                    <button
                      type="button"
                      onClick={onSelectAllCourses}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border transition-all cursor-pointer"
                    >
                      All ({courses.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Chips with subtle "Hide" (X) trigger */}
              <div className="flex flex-wrap items-center gap-2">
                {activeCourses.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-1">
                    All courses are currently hidden.{" "}
                    <button
                      onClick={onSelectAllCourses}
                      className="text-primary font-semibold hover:underline"
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
                        <span className="font-semibold uppercase">{cleanCode}</span>
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

              {/* Inactive & Opt-In Courses Section (Grouped by Block and Foundations) */}
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
                  </button>

                  {showHiddenSection && (
                    <div className="space-y-2 mt-2 pt-1 pl-4 border-l-2 border-border/50">
                      {/* Other Block Courses */}
                      {inactiveOtherBlock.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Block {otherBlockNum} Courses ({currentBlock === 1 ? "Starts Week 6" : "Weeks 1–5"}):
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {inactiveOtherBlock.map((course) => {
                              const cleanCode = getCleanCourseCode(course.course_code, course.name);
                              const cleanName = getCleanCourseName(course.course_code, course.name);
                              const courseColor = getCourseColor(course.course_code || course.id);

                              return (
                                <button
                                  key={course.id}
                                  type="button"
                                  onClick={() => onToggleCourse(course.id)}
                                  title={`Opt-in to ${cleanCode} ${cleanName}`}
                                  aria-label={`Opt-in to ${cleanCode} ${cleanName}`}
                                  className={`text-xs font-medium pl-2 pr-2.5 py-0.5 rounded-md border border-dashed inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 hover:border-solid transition-all cursor-pointer ${courseColor.badge}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span className="font-semibold uppercase">{cleanCode}</span>
                                  <span className="truncate max-w-[150px]">{cleanName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Foundations / Kenan-Flagler Courses */}
                      {inactiveFoundations.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Foundations & Summits (Kenan-Flagler Canvas):
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {inactiveFoundations.map((course) => {
                              const cleanCode = getCleanCourseCode(course.course_code, course.name);
                              const cleanName = getCleanCourseName(course.course_code, course.name);
                              const courseColor = getCourseColor(course.course_code || course.id);

                              return (
                                <button
                                  key={course.id}
                                  type="button"
                                  onClick={() => onToggleCourse(course.id)}
                                  title={`Opt-in to ${cleanCode} ${cleanName}`}
                                  aria-label={`Opt-in to ${cleanCode} ${cleanName}`}
                                  className={`text-xs font-medium pl-2 pr-2.5 py-0.5 rounded-md border border-dashed inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 hover:border-solid transition-all cursor-pointer ${courseColor.badge}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span className="font-semibold uppercase">{cleanCode}</span>
                                  <span className="truncate max-w-[150px]">{cleanName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Inactive Current Block Courses */}
                      {inactiveCurrentBlock.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Current Block {currentBlock} Hidden Courses:
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {inactiveCurrentBlock.map((course) => {
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
                                  className={`text-xs font-medium pl-2 pr-2.5 py-0.5 rounded-md border border-dashed inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 hover:border-solid transition-all cursor-pointer ${courseColor.badge}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span className="font-semibold uppercase">{cleanCode}</span>
                                  <span className="truncate max-w-[150px]">{cleanName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Week Selector Scrubber & Global Actions (Block 1 & Block 2 Divisions) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Block 1 Group */}
                <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-md border border-border/70">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 text-primary">
                    Block 1
                  </span>
                  {block1Weeks.map((w) => {
                    const isCurrent = w === selectedWeek;
                    return (
                      <button
                        key={w}
                        onClick={() => handleWeekClick(w)}
                        className={`h-8 min-w-[38px] px-1.5 rounded-sm border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                            : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                        }`}
                        aria-label={`Select Block 1 Week ${w}`}
                      >
                        <span className="text-[7px] uppercase tracking-wider opacity-80 font-medium">
                          W{w}
                        </span>
                        <span className="text-xs font-semibold leading-none tabular-nums">{w}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Block 2 Group */}
                <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-md border border-border/70">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 text-muted-foreground">
                    Block 2
                  </span>
                  {block2Weeks.map((w) => {
                    const isCurrent = w === selectedWeek;
                    const b2Week = w - 5;
                    return (
                      <button
                        key={w}
                        onClick={() => handleWeekClick(w)}
                        className={`h-8 min-w-[38px] px-1.5 rounded-sm border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                            : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                        }`}
                        aria-label={`Select Block 2 Week ${b2Week}`}
                      >
                        <span className="text-[7px] uppercase tracking-wider opacity-80 font-medium">
                          W{b2Week}
                        </span>
                        <span className="text-xs font-semibold leading-none tabular-nums">{b2Week}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="text-xs font-medium text-muted-foreground hidden sm:inline tabular-nums">
                  Block {currentBlock} • Week {blockWeekNum} ({weekDateRangeLabel})
                </span>
              </div>
            </div>
          </div>

          {/* B. KPI METRIC CARDS DECK (4 SOLID METRICS - All Scoped to Selected Week) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Deliverables Metric */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deliverables
              </div>
              <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">
                {submittedDeliverablesCount} / {totalDeliverablesCount}
              </div>
              <p className="text-xs text-muted-foreground">Submitted for Block {currentBlock} W{blockWeekNum}</p>
            </div>

            {/* Coursework & Lectures Metric */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Coursework
              </div>
              <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">
                {completedCourseworkCount} / {totalCourseworkCount}
              </div>
              <p className="text-xs text-muted-foreground">Completed for Block {currentBlock} W{blockWeekNum}</p>
            </div>

            {/* Course Files Metric */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Course Files
              </div>
              <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">
                {completedFilesCount} / {totalFilesCount}
              </div>
              <p className="text-xs text-muted-foreground">Reviewed for Block {currentBlock} W{blockWeekNum}</p>
            </div>

            {/* Overall Progress Metric */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-xs space-y-1">
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Overall Progress
              </div>
              <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-foreground">
                {weekProgressPercent}%
              </div>
              <p className="text-xs text-muted-foreground">Block {currentBlock} W{blockWeekNum} completion</p>
            </div>
          </div>

          {/* C. MOBILE VIEWPORT TAB SWITCHER (xl:hidden) */}
          <div className="xl:hidden flex items-center bg-card border border-border p-1 rounded-lg">
            <button
              onClick={() => setMobileTab("actions")}
              className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
            {/* SUB-COLUMN 1: Priority Actions (Briefings, Zoom & Homework) -> (lg:col-span-5) */}
            <div
              className={`lg:col-span-5 space-y-6 ${
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

            {/* SUB-COLUMN 2: Course Readings & Cases Checklist -> (lg:col-span-7) */}
            <div
              className={`lg:col-span-7 ${
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
