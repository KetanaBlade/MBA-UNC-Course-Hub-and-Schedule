"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Sparkles,
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
    // Aggregated view across all courses
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
    <div className="space-y-6">
      {/* Course Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* All Courses Tab */}
          <button
            onClick={() => onSelectCourse(null)}
            className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
              selectedCourseId === null
                ? "bg-[#13294B] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All MBA Courses
          </button>

          {/* Individual Course Tabs */}
          {courses.map((course) => {
            const isSelected = selectedCourseId === course.id;
            return (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={`min-h-[40px] inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  isSelected
                    ? "bg-[#13294B] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{course.course_code || course.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
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
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
              onlyPending
                ? "border-amber-400 bg-amber-50 text-amber-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{onlyPending ? "Showing Incomplete Only" : "Show All Items"}</span>
          </button>
        </div>
      </div>

      {/* Week Scrubber (Horizontal Navigation) */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2 min-w-max">
          {weekNumbers.map((w) => {
            const isCurrentWeek = w === selectedWeek;
            return (
              <button
                key={w}
                onClick={() => onSelectWeek(w)}
                className={`group flex min-h-[44px] flex-col items-center justify-center rounded-xl px-4 py-2 text-xs font-medium transition active:scale-95 ${
                  isCurrentWeek
                    ? "bg-[#4B9CD3] text-[#13294B] shadow-sm font-bold ring-2 ring-[#4B9CD3]/40"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider opacity-80">
                  Week
                </span>
                <span className="text-base font-bold tabular-nums">{w}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Weekly Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Deliverables</span>
            <GraduationCap className="h-4 w-4 text-[#13294B]" />
          </div>
          <div className="text-lg font-bold tabular-nums text-slate-900">
            {submittedDeliverablesCount} / {totalDeliverablesCount}
          </div>
          <span className="text-[11px] text-slate-500">submitted for Week {selectedWeek}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Readings & Cases</span>
            <FileText className="h-4 w-4 text-[#4B9CD3]" />
          </div>
          <div className="text-lg font-bold tabular-nums text-slate-900">
            {completedReadingsCount} / {totalReadingsCount}
          </div>
          <span className="text-[11px] text-slate-500">completed</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Live Zoom Classes</span>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold tabular-nums text-slate-900">
            {activeBundles.flatMap((b) => b.liveSessions).length}
          </div>
          <span className="text-[11px] text-slate-500">scheduled this week</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Overall Progress</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold tabular-nums text-slate-900">
            {totalDeliverablesCount + totalReadingsCount > 0
              ? Math.round(
                  ((submittedDeliverablesCount + completedReadingsCount) /
                    (totalDeliverablesCount + totalReadingsCount)) *
                    100
                )
              : 100}
            %
          </div>
          <span className="text-[11px] text-slate-500">of Week {selectedWeek} tasks</span>
        </div>
      </div>

      {/* Main Weekly Content Stack */}
      <div className="space-y-6">
        {/* Section 1: Weekly Briefings & Announcements */}
        <WeeklyOverviewCard
          announcements={allAnnouncements}
          weekNumber={selectedWeek}
        />

        {/* Section 2: Rescued Pre-Readings, Cases & Materials */}
        <ReadingsSection
          readings={allReadings}
          weekNumber={selectedWeek}
          onToggleComplete={onToggleCompleteReading}
        />

        {/* Section 3: Homework & Deliverables */}
        <HomeworkTracker
          deliverables={allDeliverables}
          weekNumber={selectedWeek}
        />
      </div>
    </div>
  );
}
