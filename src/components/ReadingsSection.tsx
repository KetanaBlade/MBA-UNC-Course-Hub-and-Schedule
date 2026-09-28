"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCheck,
  Download,
  ExternalLink,
  FolderTree,
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
        // Do not render generic reading or video tags
        return null;
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
      {/* Sticky Header: Clean, count integrated into headline, zero zoom wrapping */}
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
                  <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between gap-3 sticky top-0 z-10 backdrop-blur-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                      >
                        {getCleanCourseCode(courseCode, courseGroup.courseName)}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {getCleanCourseName(courseCode, courseGroup.courseName)}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground font-semibold">
                      {courseCompleted}/{courseGroup.items.length} read
                    </span>
                  </div>
                )}

                {/* Reading Rows */}
                {courseGroup.items.map((reading) => {
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

                      {/* Content Details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {courseKeys.length === 1 && reading.courseCode && (
                            <span
                              className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                            >
                              {getCleanCourseName(reading.courseCode, reading.courseName)}
                            </span>
                          )}
                          <h3
                            className={`text-sm sm:text-base font-semibold leading-snug ${
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
                            <span className="font-mono text-xs text-muted-foreground/80">
                              • {reading.folderPath}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Trigger - View on Canvas & Direct Download for Files */}
                      <div className="flex flex-col gap-1 shrink-0 self-center">
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
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
