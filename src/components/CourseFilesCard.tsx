"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Layers,
  Search,
} from "lucide-react";
import { NormalizedReading } from "@/lib/canvas/types";
import { getCourseColor, getCleanCourseCode, getCleanCourseName } from "@/lib/courseColors";

interface CourseFilesCardProps {
  files: NormalizedReading[];
  weekNumber: number;
  onToggleComplete: (id: string) => void;
}

export function CourseFilesCard({ files, weekNumber, onToggleComplete }: CourseFilesCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>("all");

  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Group files by course code
  const groupedByCourse: Record<string, { courseName: string; items: NormalizedReading[] }> = {};
  files.forEach((f) => {
    const code = f.courseCode || "General";
    if (!groupedByCourse[code]) {
      groupedByCourse[code] = {
        courseName: f.courseName || "General Coursework",
        items: [],
      };
    }
    groupedByCourse[code].items.push(f);
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

  // Reset tab to "all" if selected course no longer exists
  useEffect(() => {
    if (selectedCourseTab !== "all" && !groupedByCourse[selectedCourseTab]) {
      setSelectedCourseTab("all");
    }
  }, [courseKeys, selectedCourseTab]);

  const completedCount = files.filter((f) => f.isCompleted).length;

  const filteredFiles = files.filter((f) => {
    const itemCourse = f.courseCode || "General";
    if (selectedCourseTab !== "all" && itemCourse !== selectedCourseTab) {
      return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.title.toLowerCase().includes(term) ||
      (f.folderPath && f.folderPath.toLowerCase().includes(term)) ||
      (f.courseCode && f.courseCode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col h-full transition-all">
      {/* Sticky Header: Clean, count integrated into headline, responsive course tabs & search */}
      <div className="sticky top-0 z-20 bg-card border-b border-border p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            Week {weekNumber} Course Files{" "}
            <span className="text-primary font-mono text-base font-bold">
              ({files.length})
            </span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
            Spreadsheets, slide decks, and data rescued from Canvas Files
          </p>
        </div>

        {/* RESPONSIVE HORIZONTAL COURSE TABS FOR FILES */}
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
              {/* "All Files" Tab */}
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
                <span>All Files</span>
                <span className="font-mono text-[11px] opacity-80">({files.length})</span>
              </button>

              {/* Course Tabs */}
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

        {/* Search Bar */}
        <div className="pt-0.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files by name or folder..."
              className="w-full h-8 pl-9 pr-3 text-xs sm:text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Files List (max-h-[760px]) */}
      <div className="overflow-y-auto max-h-[760px] divide-y divide-border/60">
        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground space-y-2">
            <CheckCheck className="w-8 h-8 mx-auto text-emerald-600 opacity-60" />
            <p>No course files match your filter.</p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const courseColor = file.courseCode ? getCourseColor(file.courseCode) : null;
            return (
              <div
                key={file.id}
                className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors hover:bg-muted/10 ${
                  file.isCompleted ? "opacity-60 bg-muted/5" : ""
                }`}
              >
                {/* Tactile Checkbox (Middle-aligned like action buttons) */}
                <button
                  type="button"
                  onClick={() => onToggleComplete(file.id)}
                  aria-label={`Mark ${file.title} as ${file.isCompleted ? "incomplete" : "complete"}`}
                  className={`self-center flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded-sm border-2 transition-all cursor-pointer ${
                    file.isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                      : "border-border bg-card hover:border-primary"
                  }`}
                >
                  {file.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Details (min-w-0 pr-2 with break-all to ensure file names NEVER overlap buttons) */}
                <div className="space-y-1.5 min-w-0 flex-1 pr-2">
                  {/* Always stack: Course badge on its own line above title */}
                  {selectedCourseTab === "all" && file.courseCode && courseColor && (
                    <div>
                      <span
                        className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                      >
                        {getCleanCourseName(file.courseCode, file.courseName)}
                      </span>
                    </div>
                  )}
                  <h4
                    className={`text-sm sm:text-base font-semibold leading-snug break-all [overflow-wrap:anywhere] ${
                      file.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {file.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-muted-foreground">
                    {file.category === "spreadsheet" ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        EXCEL / MODEL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-muted-foreground">
                        <FileText className="w-3.5 h-3.5" />
                        DOCUMENT
                      </span>
                    )}
                    {file.folderPath && (
                      <span className="font-mono text-xs text-muted-foreground/80 break-all [overflow-wrap:anywhere]">
                        • {file.folderPath}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stacked View & Download Buttons (shrink-0 pl-2 self-center) */}
                <div className="shrink-0 flex flex-col gap-1.5 items-end self-center pl-2">
                  <a
                    href={file.canvasUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                    title="View on Canvas"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>

                  {file.fileUrl && (
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      title="Download file"
                    >
                      <span>Download</span>
                      <Download className="w-3 h-3 text-muted-foreground" />
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
