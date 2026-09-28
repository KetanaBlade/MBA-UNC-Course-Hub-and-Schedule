"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FolderTree,
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

  // Check and update tab scroll indicators
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

  // If currently selected tab no longer exists in available courses, reset to "all"
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
          <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/30">
            HBR CASE
          </span>
        );
      case "slides":
        return (
          <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/30">
            SLIDES
          </span>
        );
      case "spreadsheet":
        return (
          <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            MODEL
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

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col h-full transition-all">
      {/* Sticky Header: Clean, count integrated into headline, progress & responsive course tabs */}
      <div className="sticky top-0 z-20 bg-card border-b border-border p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            Week {weekNumber} Coursework & Lectures{" "}
            <span className="text-primary font-mono text-base font-bold">
              ({readings.length})
            </span>
          </h2>
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-muted-foreground mt-1">
            <span>
              {completedCount} of {readings.length} completed
            </span>
            <span className="font-mono font-bold text-foreground">
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

        {/* RESPONSIVE HORIZONTAL COURSE TABS */}
        {courseKeys.length > 1 && (
          <div className="pt-1 flex items-center gap-1.5">
            {/* Left Scroll Button */}
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll courses left"
              className={`shrink-0 h-8 w-8 rounded-md flex items-center justify-center border border-border transition-all ${
                canScrollLeft
                  ? "bg-card text-foreground hover:bg-muted/50 cursor-pointer shadow-2xs"
                  : "bg-muted/10 text-muted-foreground/30 cursor-not-allowed opacity-40 border-border/40"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Tabs Track */}
            <div
              ref={tabsRef}
              onScroll={updateScrollButtons}
              className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
            >
              {/* "All Courses" Tab */}
              <button
                type="button"
                onClick={() => setSelectedCourseTab("all")}
                className={`shrink-0 flex items-center gap-2 h-8 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                  selectedCourseTab === "all"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs border-primary"
                    : "bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Courses</span>
                <span className="font-mono text-[11px] opacity-80">({readings.length})</span>
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
                        ? "bg-card text-foreground border-primary ring-2 ring-primary/20 shadow-xs font-bold"
                        : "bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-xs border ${color.badge}`}
                    >
                      {getCleanCourseCode(code, group.courseName)}
                    </span>
                    <span className="max-w-[140px] sm:max-w-[180px] truncate">
                      {getCleanCourseName(code, group.courseName)}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
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

            {/* Right Scroll Button */}
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              disabled={!canScrollRight}
              aria-label="Scroll courses right"
              className={`shrink-0 h-8 w-8 rounded-md flex items-center justify-center border border-border transition-all ${
                canScrollRight
                  ? "bg-card text-foreground hover:bg-muted/50 cursor-pointer shadow-2xs"
                  : "bg-muted/10 text-muted-foreground/30 cursor-not-allowed opacity-40 border-border/40"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
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
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              All ({readings.length})
            </button>
            <button
              onClick={() => setCategoryFilter("video")}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                categoryFilter === "video"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Videos ({readings.filter((r) => r.category === "video").length})
            </button>
            <button
              onClick={() => setCategoryFilter("case")}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                categoryFilter === "case"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Cases ({readings.filter((r) => r.category === "case").length})
            </button>
            <button
              onClick={() => setCategoryFilter("pending")}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                categoryFilter === "pending"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              To Do ({readings.length - completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Container (max-h-[760px]) */}
      <div className="overflow-y-auto max-h-[760px] divide-y divide-border/60">
        {filteredReadings.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground space-y-2">
            <CheckCheck className="w-8 h-8 mx-auto text-emerald-600 opacity-60" />
            <p>No coursework matches your filter.</p>
          </div>
        ) : (
          filteredReadings.map((reading) => {
            const courseColor = reading.courseCode ? getCourseColor(reading.courseCode) : null;

            return (
              <div
                key={reading.id}
                className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors hover:bg-muted/10 ${
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
                  className={`mt-0.5 flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded border-2 transition-all cursor-pointer ${
                    reading.isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                      : "border-border bg-card hover:border-primary shadow-2xs"
                  }`}
                >
                  {reading.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Content Details (min-w-0 pr-2 with break-all to prevent extending behind buttons) */}
                <div className="min-w-0 flex-1 space-y-1.5 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Show course badge if on All Courses tab */}
                    {selectedCourseTab === "all" && reading.courseCode && courseColor && (
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                      >
                        {getCleanCourseName(reading.courseCode, reading.courseName)}
                      </span>
                    )}
                    <h3
                      className={`text-sm sm:text-base font-semibold leading-snug break-all [overflow-wrap:anywhere] ${
                        reading.isCompleted
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {reading.title}
                    </h3>
                  </div>

                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-muted-foreground">
                    {getCategoryBadge(reading.category)}

                    {reading.pointsPossible !== undefined && reading.pointsPossible > 0 && (
                      <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20">
                        {reading.pointsPossible} PTS
                      </span>
                    )}

                    {reading.folderPath && (
                      <span className="font-mono text-xs text-muted-foreground/80 break-all [overflow-wrap:anywhere]">
                        • {reading.folderPath}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Trigger - View on Canvas & Direct Download for Files (shrink-0 pl-2) */}
                <div className="flex flex-col gap-1.5 shrink-0 self-center pl-2">
                  <a
                    href={reading.canvasUrl || reading.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs justify-center"
                    title="Open and view on Canvas"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                  {reading.source === "files_tab" && reading.fileUrl && (
                    <a
                      href={reading.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs justify-center"
                      title="Download file directly"
                    >
                      <span>Download</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
