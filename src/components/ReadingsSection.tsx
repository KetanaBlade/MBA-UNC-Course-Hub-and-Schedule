"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronDown,
  ExternalLink,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { NormalizedReading } from "@/lib/canvas/types";
import { getCourseColor, getCleanCourseCode, getCleanCourseName } from "@/lib/courseColors";
import { AppStorage } from "@/lib/storage";
import { HorizontalCourseTabs, CourseTabItem } from "@/components/HorizontalCourseTabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "todo" | "completed">("all");
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>("all");

  useEffect(() => {
    setTaskStatusFilter(AppStorage.getTaskStatusFilter());
    setSelectedCourseTab(AppStorage.getReadingsCourseTab());
  }, []);

  const handleStatusFilterChange = (val: string) => {
    const next = val as "all" | "todo" | "completed";
    setTaskStatusFilter(next);
    AppStorage.setTaskStatusFilter(next);
  };

  const handleSelectTab = (tab: string) => {
    setSelectedCourseTab(tab);
    AppStorage.setReadingsCourseTab(tab);
  };

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

  const courseTabs: CourseTabItem[] = [
    { key: "all", label: "All Courses", count: readings.length },
    ...courseKeys.map((code) => ({
      key: code,
      label: getCleanCourseName(code, groupedByCourse[code].courseName),
      count: groupedByCourse[code].items.length,
    })),
  ];

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

  // Filter items based on active tab, search, and status
  const filteredReadings = readings.filter((r) => {
    const itemCourse = r.courseCode || "General";
    if (selectedCourseTab !== "all" && itemCourse !== selectedCourseTab) {
      return false;
    }

    if (taskStatusFilter === "todo" && r.isCompleted) return false;
    if (taskStatusFilter === "completed" && !r.isCompleted) return false;

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
  const shouldGroupByCourse = selectedCourseTab === "all" && !searchTerm.trim() && taskStatusFilter === "all" && courseKeys.length > 1;

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

        {/* Responsive Horizontal Course Tabs (Standard Underline Tab Layout) */}
        {courseKeys.length > 1 && (
          <HorizontalCourseTabs
            tabs={courseTabs}
            selectedTab={selectedCourseTab}
            onSelectTab={handleSelectTab}
          />
        )}

        {/* Search + Category Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coursework, lectures, or readings..."
              className="w-full h-8 pl-9 pr-3 text-xs sm:text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Accessible Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Filter coursework by status: currently ${
                  taskStatusFilter === "all"
                    ? "All"
                    : taskStatusFilter === "todo"
                    ? "To Do"
                    : "Completed"
                }`}
              >
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="font-semibold text-foreground">
                  {taskStatusFilter === "all"
                    ? `All (${readings.length})`
                    : taskStatusFilter === "todo"
                    ? `To Do (${readings.length - completedCount})`
                    : `Completed (${completedCount})`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup
                value={taskStatusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <DropdownMenuRadioItem value="all">
                  All Tasks ({readings.length})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="todo">
                  To Do ({readings.length - completedCount})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">
                  Completed ({completedCount})
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
