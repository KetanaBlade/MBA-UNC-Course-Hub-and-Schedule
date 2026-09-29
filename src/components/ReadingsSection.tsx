"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { NormalizedReading, ReadingCategory } from "@/lib/canvas/types";
import { getCourseColor, getCleanCourseCode, getCleanCourseName } from "@/lib/courseColors";

interface ReadingsSectionProps {
  readings: NormalizedReading[];
  weekNumber: number;
  onToggleComplete: (id: string) => void;
}

export function ReadingsSection({
  readings,
  weekNumber,
  onToggleComplete,
}: ReadingsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "case" | "reading" | "video" | "pending">("all");
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>("all");

  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Group all readings by course code
  const groupedByCourse: Record<string, { courseName: string; items: NormalizedReading[] }> = {};
  readings.forEach((r) => {
    const code = r.courseCode || "General";
    if (!groupedByCourse[code]) {
      groupedByCourse[code] = {
        courseName: r.courseName || "General Coursework",
        items: [],
      };
    }
    groupedByCourse[code].items.push(r);
  });

  const courseKeys = Object.keys(groupedByCourse);

  const updateScrollButtons = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [courseKeys.length]);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = 180;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  useEffect(() => {
    if (selectedCourseTab !== "all" && !groupedByCourse[selectedCourseTab]) {
      setSelectedCourseTab("all");
    }
  }, [courseKeys, selectedCourseTab]);

  const completedCount = readings.filter((r) => r.isCompleted).length;
  const progressPercent =
    readings.length > 0 ? Math.round((completedCount / readings.length) * 100) : 0;

  const handleCheckboxClick = (reading: NormalizedReading) => {
    onToggleComplete(reading.id);
    if (!reading.isCompleted && completedCount + 1 === readings.length) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#D44E18", "#EF6453", "#059669"],
        });
      } catch {
        // Confetti optional
      }
    }
  };

  const getCategoryBadge = (category: ReadingCategory) => {
    switch (category) {
      case "case":
        return (
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            CASE
          </span>
        );
      case "slides":
        return (
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
            SLIDES
          </span>
        );
      case "spreadsheet":
        return (
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            MODEL
          </span>
        );
      case "video":
        return (
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            VIDEO
          </span>
        );
      default:
        return null;
    }
  };

  // Filter items based on active tab, search, and category
  const filteredReadings = readings.filter((r) => {
    const itemCourse = r.courseCode || "General";
    if (selectedCourseTab !== "all" && itemCourse !== selectedCourseTab) {
      return false;
    }

    if (categoryFilter === "case" && r.category !== "case") return false;
    if (categoryFilter === "reading" && r.category !== "reading") return false;
    if (categoryFilter === "video" && r.category !== "video") return false;
    if (categoryFilter === "pending" && r.isCompleted) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(term);
      const matchCourse = r.courseCode?.toLowerCase().includes(term);
      const matchFolder = r.folderPath?.toLowerCase().includes(term);
      return matchTitle || matchCourse || matchFolder;
    }
    return true;
  });

  // Render a clean, scannable reading item row
  const renderItemRow = (reading: NormalizedReading, showCourseBadge = false) => {
    const courseColor = reading.courseCode ? getCourseColor(reading.courseCode) : null;
    const cleanCode = reading.courseCode
      ? getCleanCourseCode(reading.courseCode, reading.courseName)
      : "";

    return (
      <div
        key={reading.id}
        className={`p-3 sm:py-3.5 sm:px-4 flex items-center gap-3 transition-colors hover:bg-muted/10 ${
          reading.isCompleted ? "opacity-60 bg-muted/5" : ""
        }`}
      >
        {/* Tactile Checkbox */}
        <button
          type="button"
          onClick={() => handleCheckboxClick(reading)}
          aria-label={`Mark ${reading.title} as ${
            reading.isCompleted ? "incomplete" : "complete"
          }`}
          className={`flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded border-2 transition-all cursor-pointer ${
            reading.isCompleted
              ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
              : "border-border bg-card hover:border-primary shadow-2xs"
          }`}
        >
          {reading.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content Details */}
        <div className="min-w-0 flex-1 pr-2 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {showCourseBadge && courseColor && cleanCode && (
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs border shrink-0 ${courseColor.badge}`}
              >
                {cleanCode}
              </span>
            )}
            <h3
              className={`text-xs sm:text-sm font-semibold leading-snug break-words ${
                reading.isCompleted
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
            >
              {reading.title}
            </h3>
            {getCategoryBadge(reading.category)}
            {reading.pointsPossible !== undefined && reading.pointsPossible > 0 && (
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                • {reading.pointsPossible} pts
              </span>
            )}
          </div>
        </div>

        {/* Action Trigger */}
        <div className="shrink-0 pl-1">
          <a
            href={reading.canvasUrl || reading.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs justify-center"
            title="Open and view on Canvas"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </div>
    );
  };

  // Check if we should render grouped by course
  const shouldGroupByCourse = selectedCourseTab === "all" && !searchTerm.trim() && categoryFilter === "all" && courseKeys.length > 1;

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col h-full transition-all">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            Week {weekNumber} Coursework & Lectures{" "}
            <span className="text-primary text-base font-semibold tabular-nums">
              ({readings.length})
            </span>
          </h2>
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-muted-foreground mt-1">
            <span>
              {completedCount} of {readings.length} completed
            </span>
            <span className="font-semibold text-foreground tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Responsive Horizontal Course Tabs */}
        {courseKeys.length > 1 && (
          <div className="relative pt-1 group">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                aria-label="Scroll courses left"
                className="absolute left-0 top-1 bottom-0 z-10 flex items-center justify-start pl-0.5 pr-4 bg-gradient-to-r from-card via-card/90 to-transparent text-foreground/70 hover:text-foreground cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-5 h-5 drop-shadow-xs" />
              </button>
            )}

            <div
              ref={tabsRef}
              onScroll={updateScrollButtons}
              className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
            >
              {/* All Courses Tab */}
              <button
                type="button"
                onClick={() => setSelectedCourseTab("all")}
                className={`shrink-0 flex items-center gap-2 h-8 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                  selectedCourseTab === "all"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs border-primary"
                    : "bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Courses</span>
                <span className="text-[11px] opacity-80 tabular-nums">({readings.length})</span>
              </button>

              {/* Course-specific Tabs */}
              {courseKeys.map((code) => {
                const group = groupedByCourse[code];
                const color = getCourseColor(code);
                const isSelected = selectedCourseTab === code;
                const doneCount = group.items.filter((i) => i.isCompleted).length;
                const isAllDone = doneCount === group.items.length && group.items.length > 0;

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedCourseTab(code)}
                    className={`shrink-0 flex items-center gap-2 h-8 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-card text-foreground border-primary ring-2 ring-primary/20 shadow-xs font-semibold"
                        : "bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs border ${color.badge}`}
                    >
                      {getCleanCourseCode(code, group.courseName)}
                    </span>
                    <span className="max-w-[140px] sm:max-w-[180px] truncate">
                      {getCleanCourseName(code, group.courseName)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full tabular-nums ${
                        isAllDone
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doneCount}/{group.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollTabs("right")}
                aria-label="Scroll courses right"
                className="absolute right-0 top-1 bottom-0 z-10 flex items-center justify-end pr-0.5 pl-4 bg-gradient-to-l from-card via-card/90 to-transparent text-foreground/70 hover:text-foreground cursor-pointer transition-colors"
              >
                <ChevronRight className="w-5 h-5 drop-shadow-xs" />
              </button>
            )}
          </div>
        )}

        {/* Search + Category Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lectures, videos, or cases..."
              className="w-full h-8 pl-9 pr-3 text-xs sm:text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              All ({readings.length})
            </button>
            <button
              onClick={() => setCategoryFilter("video")}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                categoryFilter === "video"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Videos ({readings.filter((r) => r.category === "video").length})
            </button>
            <button
              onClick={() => setCategoryFilter("case")}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                categoryFilter === "case"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Cases ({readings.filter((r) => r.category === "case").length})
            </button>
            <button
              onClick={() => setCategoryFilter("pending")}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                categoryFilter === "pending"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              To Do ({readings.length - completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Container */}
      <div className="overflow-y-auto max-h-[760px] divide-y divide-border/60">
        {filteredReadings.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground space-y-2">
            <CheckCheck className="w-8 h-8 mx-auto text-emerald-600 opacity-60" />
            <p>No coursework matches your filter.</p>
          </div>
        ) : shouldGroupByCourse ? (
          courseKeys.map((code) => {
            const group = groupedByCourse[code];
            const groupColor = getCourseColor(code);
            const groupCleanCode = getCleanCourseCode(code, group.courseName);
            const groupCleanName = getCleanCourseName(code, group.courseName);
            const groupDone = group.items.filter((i) => i.isCompleted).length;

            return (
              <div key={code}>
                {/* Clean Course Group Divider */}
                <div className="sticky top-0 z-10 px-4 py-2 bg-muted/40 backdrop-blur-xs border-y border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs border ${groupColor.badge}`}
                    >
                      {groupCleanCode}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate max-w-[240px] sm:max-w-none">
                      {groupCleanName}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                    {groupDone}/{group.items.length} completed
                  </span>
                </div>
                {/* Course Items with zero individual course tags */}
                <div className="divide-y divide-border/40">
                  {group.items.map((reading) => renderItemRow(reading, false))}
                </div>
              </div>
            );
          })
        ) : (
          filteredReadings.map((reading) =>
            renderItemRow(reading, selectedCourseTab === "all" && courseKeys.length > 1)
          )
        )}
      </div>
    </div>
  );
}
