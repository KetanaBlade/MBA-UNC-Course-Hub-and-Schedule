"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Check,
  CheckCheck,
  Download,
  ExternalLink,
  FolderTree,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { NormalizedReading, ReadingCategory } from "@/lib/canvas/types";
import { getCourseColor } from "@/lib/courseColors";

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
      case "video":
        return (
          <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30">
            VIDEO
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm bg-muted/70 text-foreground border border-border">
            READING
          </span>
        );
    }
  };

  // Filter items
  const filteredReadings = readings.filter((r) => {
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

  // Group by course code
  const groupedByCourse: Record<string, { courseName: string; items: NormalizedReading[] }> = {};
  filteredReadings.forEach((r) => {
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

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col h-full transition-all">
      {/* Sticky Header with Title and Progress */}
      <div className="sticky top-0 z-20 bg-card border-b border-border p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-sans">
                Week {weekNumber} Readings & Cases
              </h2>
            </div>
            <p className="text-xs sm:text-[13px] font-medium text-muted-foreground font-sans">
              Required readings, Harvard Business cases, and video lectures
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="font-mono text-xs font-bold uppercase px-3 py-1 rounded-sm bg-muted/60 border border-border text-foreground">
              {completedCount} of {readings.length} Completed ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls: Search + Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search readings, cases, or modules..."
              className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              All ({readings.length})
            </button>
            <button
              onClick={() => setCategoryFilter("case")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                categoryFilter === "case"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Cases ({readings.filter((r) => r.category === "case").length})
            </button>
            <button
              onClick={() => setCategoryFilter("pending")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                categoryFilter === "pending"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              To Read ({readings.length - completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Readings Container */}
      <div className="overflow-y-auto max-h-[780px] divide-y divide-border/60">
        {filteredReadings.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground space-y-2">
            <CheckCheck className="w-8 h-8 mx-auto text-emerald-600 opacity-60" />
            <p>No readings match your search or filter.</p>
          </div>
        ) : (
          courseKeys.map((courseCode) => {
            const courseGroup = groupedByCourse[courseCode];
            const courseColor = getCourseColor(courseCode);
            const courseCompleted = courseGroup.items.filter((i) => i.isCompleted).length;

            return (
              <div key={courseCode} className="divide-y divide-border/40">
                {/* Course Header Banner */}
                {courseKeys.length > 1 && (
                  <div className="px-4 sm:px-5 py-3 bg-muted/20 border-b border-border flex items-center justify-between gap-3 sticky top-0 z-10 backdrop-blur-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                      >
                        {courseCode}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {courseGroup.courseName}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground font-semibold">
                      {courseCompleted}/{courseGroup.items.length} read
                    </span>
                  </div>
                )}

                {/* Items in this course */}
                {courseGroup.items.map((reading) => {
                  return (
                    <div
                      key={reading.id}
                      className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors hover:bg-muted/10 ${
                        reading.isCompleted ? "opacity-60 bg-muted/5" : ""
                      }`}
                    >
                      {/* Tactile Checkbox (20x20px) */}
                      <button
                        type="button"
                        onClick={() => handleCheckboxClick(reading)}
                        aria-label={`Mark ${reading.title} as ${
                          reading.isCompleted ? "incomplete" : "complete"
                        }`}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 transition-all cursor-pointer ${
                          reading.isCompleted
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                            : "border-border bg-card hover:border-primary"
                        }`}
                      >
                        {reading.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Content Details */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {courseKeys.length === 1 && reading.courseCode && (
                            <span
                              className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                            >
                              {reading.courseCode}
                            </span>
                          )}
                          <h3
                            className={`text-base font-semibold leading-relaxed font-sans ${
                              reading.isCompleted
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {reading.title}
                          </h3>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-muted-foreground font-sans">
                          {getCategoryBadge(reading.category)}

                          {reading.source === "files_tab" && (
                            <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/30 flex items-center gap-1">
                              <FolderTree className="w-3 h-3" />
                              FILES TAB
                            </span>
                          )}

                          {reading.folderPath && (
                            <span className="font-mono text-xs text-muted-foreground/80">
                              • {reading.folderPath}
                            </span>
                          )}

                          {reading.fileSizeFormatted && (
                            <span className="font-mono text-xs tabular-nums text-muted-foreground/80">
                              • {reading.fileSizeFormatted}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex items-center gap-1.5 shrink-0 self-center">
                        {reading.fileUrl ? (
                          <a
                            href={reading.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="h-8 px-3 rounded-md border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                        ) : (
                          <a
                            href={reading.canvasUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 px-3 rounded-md border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Open on Canvas"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="hidden sm:inline">Open</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
