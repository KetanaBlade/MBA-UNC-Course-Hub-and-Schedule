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

  let maxWeeks = 8;
  Object.values(bundlesByCourse).forEach((bundles) => {
    if (bundles.length > maxWeeks) maxWeeks = bundles.length;
  });
  const weekNumbers = Array.from({ length: maxWeeks }, (_, i) => i + 1);

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
    <div className="space-y-6">
      {/* Anchored Filter & Control Toolbar (Recipe 5.3) */}
      <div className="bg-muted/20 border border-border/70 rounded-md p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Course Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onSelectCourse(null)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
              selectedCourseId === null
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Courses
          </button>

          {courses.map((course) => {
            const isSelected = selectedCourseId === course.id;
            return (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{course.course_code || course.name}</span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase px-1 py-0.2 rounded-sm ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {course.instance === "digitalcampus" ? "2U" : "KF"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Toggle (Recipe 5.5 Outline Button) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyPending(!onlyPending)}
            className={`h-8 px-2.5 rounded-md border border-border text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 ${
              onlyPending
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{onlyPending ? "Showing Incomplete" : "Show All Items"}</span>
          </button>
        </div>
      </div>

      {/* Week Scrubber (Anchored Navigation Bar) */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2 min-w-max">
          {weekNumbers.map((w) => {
            const isCurrentWeek = w === selectedWeek;
            return (
              <button
                key={w}
                onClick={() => onSelectWeek(w)}
                className={`h-10 min-w-[70px] px-3.5 rounded-md text-xs font-bold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex flex-col items-center justify-center ${
                  isCurrentWeek
                    ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/40"
                    : "border border-border/70 bg-card hover:bg-muted/40 text-foreground"
                }`}
              >
                <span className="font-mono text-[9px] uppercase tracking-wider opacity-75">
                  WEEK
                </span>
                <span className="text-sm font-bold tabular-nums font-mono leading-none">
                  {w}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* De-Boxified Quick Metric Deck (Recipe 5.3 Style Anchored Panel) */}
      <div className="bg-muted/20 border border-border/70 rounded-md p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Deliverables</span>
            <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl font-extrabold tabular-nums font-mono text-foreground">
            {submittedDeliverablesCount} / {totalDeliverablesCount}
          </div>
          <p className="text-[11px] text-muted-foreground">submitted for Week {selectedWeek}</p>
        </div>

        <div className="space-y-0.5 sm:border-l sm:border-border/50 sm:pl-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Readings & Cases</span>
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-xl font-extrabold tabular-nums font-mono text-foreground">
            {completedReadingsCount} / {totalReadingsCount}
          </div>
          <p className="text-[11px] text-muted-foreground">completed</p>
        </div>

        <div className="space-y-0.5 border-t border-border/50 pt-2 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Live Zoom</span>
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold tabular-nums font-mono text-foreground">
            {activeBundles.flatMap((b) => b.liveSessions).length}
          </div>
          <p className="text-[11px] text-muted-foreground">sessions scheduled</p>
        </div>

        <div className="space-y-0.5 border-t border-border/50 pt-2 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Completion Rate</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold tabular-nums font-mono text-foreground">
            {totalDeliverablesCount + totalReadingsCount > 0
              ? Math.round(
                  ((submittedDeliverablesCount + completedReadingsCount) /
                    (totalDeliverablesCount + totalReadingsCount)) *
                    100
                )
              : 100}
            %
          </div>
          <p className="text-[11px] text-muted-foreground">overall pace</p>
        </div>
      </div>

      {/* Main Weekly Content Stack (Flat Cards) */}
      <div className="space-y-6">
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
