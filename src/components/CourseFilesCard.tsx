"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  Search,
} from "lucide-react";
import { NormalizedReading } from "@/lib/canvas/types";
import { getCourseColor, getCleanCourseCode, getCleanCourseName } from "@/lib/courseColors";
import { AppStorage } from "@/lib/storage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseFilesCardProps {
  files: NormalizedReading[];
  weekNumber: number;
  onToggleComplete: (id: string) => void;
}

export function CourseFilesCard({ files, weekNumber, onToggleComplete }: CourseFilesCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [fileStatusFilter, setFileStatusFilter] = useState<"all" | "todo" | "completed">("all");
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>("all");

  useEffect(() => {
    setFileStatusFilter(AppStorage.getFileStatusFilter());
    setSelectedCourseTab(AppStorage.getFilesCourseTab());
  }, []);

  const handleStatusFilterChange = (val: string) => {
    const next = val as "all" | "todo" | "completed";
    setFileStatusFilter(next);
    AppStorage.setFileStatusFilter(next);
  };

  const handleSelectTab = (tab: string) => {
    setSelectedCourseTab(tab);
    AppStorage.setFilesCourseTab(tab);
  };

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

  const completedFilesCount = files.filter((f) => f.isCompleted).length;

  const filteredFiles = files.filter((f) => {
    const itemCourse = f.courseCode || "General";
    if (selectedCourseTab !== "all" && itemCourse !== selectedCourseTab) {
      return false;
    }

    if (fileStatusFilter === "todo" && f.isCompleted) return false;
    if (fileStatusFilter === "completed" && !f.isCompleted) return false;

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
              className={`text-xs sm:text-sm font-semibold leading-snug break-words ${
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

        {/* Action Triggers: Stacked vertically to maximize filename width */}
        <div className="flex flex-col gap-1 shrink-0 self-center pl-1">
          <a
            href={file.canvasUrl || file.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="h-6 px-2 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs justify-center"
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
              className="h-6 px-2 rounded border border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs justify-center"
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

        {/* Responsive Horizontal Course Tabs (Standard Underline Tab Layout) */}
        {courseKeys.length >= 1 && (
          <div className="relative border-b border-border/80 group">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                aria-label="Scroll courses left"
                className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-start pr-4 pl-0.5 bg-gradient-to-r from-card via-card/90 to-transparent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div
              ref={tabsRef}
              onScroll={updateScrollButtons}
              className="w-full flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {/* All Files Tab */}
              <button
                type="button"
                onClick={() => handleSelectTab("all")}
                className={`shrink-0 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors cursor-pointer select-none border-b-2 flex items-center gap-1.5 first:pl-0 ${
                  selectedCourseTab === "all"
                    ? "border-primary text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60 font-medium"
                }`}
              >
                <span>All Files</span>
                <span className="text-[11px] font-mono text-muted-foreground/80 tabular-nums">
                  ({files.length})
                </span>
              </button>

              {/* Course Tabs */}
              {courseKeys.map((code) => {
                const group = groupedByCourse[code];
                const isSelected = selectedCourseTab === code;
                const doneCount = group.items.filter((i) => i.isCompleted).length;
                const cleanName = getCleanCourseName(code, group.courseName);

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelectTab(code)}
                    className={`shrink-0 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors cursor-pointer select-none border-b-2 flex items-center gap-1.5 ${
                      isSelected
                        ? "border-primary text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60 font-medium"
                    }`}
                  >
                    <span>{cleanName}</span>
                    <span className="text-[11px] font-mono text-muted-foreground/80 tabular-nums">
                      ({doneCount}/{group.items.length})
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
                className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end pl-4 pr-0.5 bg-gradient-to-l from-card via-card/90 to-transparent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Search + Status Filter Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files by name or folder..."
              className="w-full h-8 pl-9 pr-3 text-xs sm:text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Accessible Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Filter files by status: currently ${
                  fileStatusFilter === "all"
                    ? "All"
                    : fileStatusFilter === "todo"
                    ? "To Do"
                    : "Completed"
                }`}
              >
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="font-semibold text-foreground">
                  {fileStatusFilter === "all"
                    ? `All (${files.length})`
                    : fileStatusFilter === "todo"
                    ? `To Do (${files.length - completedFilesCount})`
                    : `Completed (${completedFilesCount})`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup
                value={fileStatusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <DropdownMenuRadioItem value="all">
                  All Files ({files.length})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="todo">
                  To Do ({files.length - completedFilesCount})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">
                  Completed ({completedFilesCount})
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
