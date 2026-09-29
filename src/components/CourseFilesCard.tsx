"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
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

  useEffect(() => {
    if (selectedCourseTab !== "all" && !groupedByCourse[selectedCourseTab]) {
      setSelectedCourseTab("all");
    }
  }, [courseKeys, selectedCourseTab]);

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

  const getFileIcon = (title: string, category?: string) => {
    const lower = title.toLowerCase();
    if (
      lower.endsWith(".xlsx") ||
      lower.endsWith(".xls") ||
      lower.endsWith(".csv") ||
      category === "spreadsheet"
    ) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
    if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".doc")) {
      return <FileText className="w-4 h-4 text-primary shrink-0" />;
    }
    return <File className="w-4 h-4 text-muted-foreground shrink-0" />;
  };

  const renderFileRow = (file: NormalizedReading, showCourseBadge = false) => {
    const courseColor = file.courseCode ? getCourseColor(file.courseCode) : null;
    const cleanCode = file.courseCode
      ? getCleanCourseCode(file.courseCode, file.courseName)
      : "";

    return (
      <div
        key={file.id}
        className={`p-3 sm:py-3.5 sm:px-4 flex items-center gap-3 transition-colors hover:bg-muted/10 ${
          file.isCompleted ? "opacity-60 bg-muted/5" : ""
        }`}
      >
        {/* Tactile Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(file.id)}
          aria-label={`Mark ${file.title} as ${file.isCompleted ? "incomplete" : "complete"}`}
          className={`flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded border-2 transition-all cursor-pointer ${
            file.isCompleted
              ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
              : "border-border bg-card hover:border-primary shadow-2xs"
          }`}
        >
          {file.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* File icon + Name + Path */}
        <div className="min-w-0 flex-1 pr-2 space-y-0.5">
          <div className="flex items-center gap-2">
            {showCourseBadge && courseColor && cleanCode && (
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs border shrink-0 ${courseColor.badge}`}
              >
                {cleanCode}
              </span>
            )}
            {getFileIcon(file.title, file.category)}
            <h4
              className={`text-xs sm:text-sm font-semibold truncate ${
                file.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
              }`}
              title={file.title}
            >
              {file.title}
            </h4>
          </div>
          {file.folderPath && (
            <p className="text-[11px] text-muted-foreground/75 truncate pl-6">
              {file.folderPath}
            </p>
          )}
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <a
            href={file.canvasUrl || file.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs justify-center"
            title="Open and view on Canvas"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
          {file.fileUrl && (
            <a
              href={file.fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs justify-center"
              title="Download file directly"
            >
              <span>Download</span>
              <Download className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    );
  };

  const shouldGroupByCourse = selectedCourseTab === "all" && !searchTerm.trim() && courseKeys.length > 1;

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col h-full transition-all">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            Week {weekNumber} Course Files{" "}
            <span className="text-primary text-base font-semibold tabular-nums">
              ({files.length})
            </span>
          </h2>
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
              {/* All Files Tab */}
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
                <span>All Files</span>
                <span className="text-[11px] opacity-80 tabular-nums">({files.length})</span>
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

      {/* Scrollable Files List */}
      <div className="overflow-y-auto max-h-[760px] divide-y divide-border/60">
        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground space-y-2">
            <CheckCheck className="w-8 h-8 mx-auto text-emerald-600 opacity-60" />
            <p>No course files match your filter.</p>
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
                {/* Course Divider */}
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
                    {groupDone}/{group.items.length} reviewed
                  </span>
                </div>
                {/* File items */}
                <div className="divide-y divide-border/40">
                  {group.items.map((file) => renderFileRow(file, false))}
                </div>
              </div>
            );
          })
        ) : (
          filteredFiles.map((file) =>
            renderFileRow(file, selectedCourseTab === "all" && courseKeys.length > 1)
          )
        )}
      </div>
    </div>
  );
}
