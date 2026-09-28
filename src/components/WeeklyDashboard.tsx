"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  FileText,
  Filter,
  GraduationCap,
} from "lucide-react";
import { CanvasCourse, WeeklyBundle } from "@/lib/canvas/types";
import { WeeklyOverviewCard } from "./WeeklyOverviewCard";
import { ReadingsSection } from "./ReadingsSection";
import { HomeworkTracker } from "./HomeworkTracker";

interface WeeklyDashboardProps {
  courses: CanvasCourse[];
  bundlesByCourse: Record<number, WeeklyBundle[]>;
  selectedCourseId: number | null; // null represents "All Courses"
  selectedWeek: number;
  onSelectCourse: (courseId: number | null) => void;
  onSelectWeek: (week: number) => void;
  onToggleCompleteReading: (readingId: string) => void;
}

export function WeeklyDashboard({
  courses,
  bundlesByCourse,
  selectedCourseId,
  selectedWeek,
  onSelectCourse,
  onSelectWeek,
  onToggleCompleteReading,
}: WeeklyDashboardProps) {
  const [onlyPending, setOnlyPending] = useState(false);

  // Compute available weeks across active courses
  let maxWeeks = 8;
  Object.values(bundlesByCourse).forEach((bundles) => {
    if (bundles.length > maxWeeks) maxWeeks = bundles.length;
  });
  const weekNumbers = Array.from({ length: maxWeeks }, (_, i) => i + 1);

  // Filter bundles for selected course and week
  let activeBundles: WeeklyBundle[] = [];
  if (selectedCourseId === null) {
    Object.values(bundlesByCourse).forEach((bundles) => {
      const b = bundles.find((item) => item.weekNumber === selectedWeek);
      if (b) activeBundles.push(b);
    });
  } else {
    const bundles = bundlesByCourse[selectedCourseId] || [];
    const b = bundles.find((item) => item.weekNumber === selectedWeek);
    if (b) activeBundles.push(b);
  }

  // Combine items for multi-course aggregation
  const allAnnouncements = activeBundles.flatMap((b) => b.announcements);
  let allReadings = activeBundles.flatMap((b) => b.readings);
  let allDeliverables = activeBundles.flatMap((b) => b.deliverables);

  if (onlyPending) {
    allReadings = allReadings.filter((r) => !r.isCompleted);
    allDeliverables = allDeliverables.filter(
      (d) => d.status !== "graded" && d.status !== "submitted"
    );
  }

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
    <div className="space-y-5">
      {/* Anchored Filter Toolbar Deck (DESIGN_SYSTEM.md Section 5 & 8) */}
      <div className="inner-strip p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented Course Controls */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onSelectCourse(null)}
            className={`btn-tactile rounded-md px-3 py-1.5 text-xs font-bold transition ${
              selectedCourseId === null
                ? "bg-[#13294B] text-white shadow-2xs"
                : "bg-white/80 dark:bg-card text-foreground/80 hover:bg-white border border-border/80"
            }`}
          >
            All MBA Courses
          </button>

          {courses.map((course) => {
            const isSelected = selectedCourseId === course.id;
            return (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={`btn-tactile inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "bg-[#13294B] text-white shadow-2xs"
                    : "bg-white/80 dark:bg-card text-foreground/80 hover:bg-white border border-border/80"
                }`}
              >
                <span>{course.course_code || course.name}</span>
                <span
                  className={`micro-tag ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {course.instance === "digitalcampus" ? "2U" : "KF"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setOnlyPending(!onlyPending)}
            className={`btn-tactile inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold border transition ${
              onlyPending
                ? "border-amber-400 bg-amber-500/10 text-amber-900 dark:text-amber-300"
                : "border-border/80 bg-white/80 dark:bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="h-3 w-3" />
            <span>{onlyPending ? "Showing Incomplete Only" : "Show All Items"}</span>
          </button>
        </div>
      </div>

      {/* Week Scrubber (Sticky Control Rail with Tier 5 tags) */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 min-w-max">
          {weekNumbers.map((w) => {
            const isCurrentWeek = w === selectedWeek;
            return (
              <button
                key={w}
                onClick={() => onSelectWeek(w)}
                className={`btn-tactile group flex min-h-[44px] min-w-[62px] flex-col items-center justify-center rounded-md px-3 py-1.5 transition ${
                  isCurrentWeek
                    ? "bg-[#13294B] text-white shadow-xs font-bold ring-2 ring-[#4B9CD3]/50"
                    : "bg-card text-foreground/80 border border-border/80 hover:border-border hover:bg-white"
                }`}
              >
                <span className="micro-tag text-[9px] opacity-75">
                  WEEK
                </span>
                <span className="text-base font-bold tabular-nums leading-tight">{w}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* De-Boxified Quick Metric Deck (Flattened, no heavy card nesting) */}
      <div className="inner-strip p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-2 sm:p-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium">Deliverables</span>
            <GraduationCap className="h-3.5 w-3.5 text-foreground opacity-70" />
          </div>
          <div className="text-lg font-bold tabular-nums text-foreground">
            {submittedDeliverablesCount} / {totalDeliverablesCount}
          </div>
          <span className="text-[10px] text-muted-foreground">submitted for W{selectedWeek}</span>
        </div>

        <div className="p-2 sm:p-2.5 border-l border-border/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium">Readings & Cases</span>
            <FileText className="h-3.5 w-3.5 text-[#4B9CD3]" />
          </div>
          <div className="text-lg font-bold tabular-nums text-foreground">
            {completedReadingsCount} / {totalReadingsCount}
          </div>
          <span className="text-[10px] text-muted-foreground">completed</span>
        </div>

        <div className="p-2 sm:p-2.5 border-l border-border/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium">Live Zoom</span>
            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg font-bold tabular-nums text-foreground">
            {activeBundles.flatMap((b) => b.liveSessions).length}
          </div>
          <span className="text-[10px] text-muted-foreground">sessions this week</span>
        </div>

        <div className="p-2 sm:p-2.5 border-l border-border/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-medium">Week {selectedWeek} Pace</span>
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg font-bold tabular-nums text-foreground">
            {totalDeliverablesCount + totalReadingsCount > 0
              ? Math.round(
                  ((submittedDeliverablesCount + completedReadingsCount) /
                    (totalDeliverablesCount + totalReadingsCount)) *
                    100
                )
              : 100}
            %
          </div>
          <span className="text-[10px] text-muted-foreground">tasks completed</span>
        </div>
      </div>

      {/* Main Weekly Content Stack (Outer Card Only, De-boxified inside) */}
      <div className="space-y-5">
        <WeeklyOverviewCard
          announcements={allAnnouncements}
          weekNumber={selectedWeek}
        />

        <ReadingsSection
          readings={allReadings}
          weekNumber={selectedWeek}
          onToggleComplete={onToggleCompleteReading}
        />

        <HomeworkTracker
          deliverables={allDeliverables}
          weekNumber={selectedWeek}
        />
      </div>
    </div>
  );
}
