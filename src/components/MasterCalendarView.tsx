"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
  Layers,
  Video,
} from "lucide-react";
import {
  CanvasCourse,
  NormalizedDeliverable,
  NormalizedLiveSession,
  WeeklyBundle,
} from "@/lib/canvas/types";
import { getCourseColor, getCleanCourseName } from "@/lib/courseColors";
import { AppStorage } from "@/lib/storage";

interface MasterCalendarViewProps {
  courses?: CanvasCourse[];
  bundlesByCourse?: Record<number, WeeklyBundle[]>;
  deliverables: NormalizedDeliverable[];
  liveSessions: NormalizedLiveSession[];
  onExportICS: () => void;
  onToggleCompleteItem?: (id: string) => void;
}

export function MasterCalendarView({
  bundlesByCourse = {},
  deliverables,
  liveSessions,
  onExportICS,
  onToggleCompleteItem,
}: MasterCalendarViewProps) {
  const [activeFilter, setActiveFilter] = useState<"weeks" | "timeline">(() =>
    AppStorage.getCalendarFilter()
  );

  const handleFilterChange = (filter: "weeks" | "timeline") => {
    setActiveFilter(filter);
    AppStorage.setCalendarFilter(filter);
  };

  // Dynamically calculate all academic week numbers present across active courses
  const allWeekNumbers = Array.from(
    new Set(
      Object.values(bundlesByCourse).flatMap((courseBundles) =>
        courseBundles.map((b) => b.weekNumber)
      )
    )
  ).sort((a, b) => a - b);
  const weekNumbers = allWeekNumbers.length > 0 ? allWeekNumbers : [1, 2, 3, 4, 5];

  // Group bundles by week
  const weekData: Record<
    number,
    {
      deliverables: NormalizedDeliverable[];
      liveSessions: NormalizedLiveSession[];
      announcementsCount: number;
    }
  > = {};

  weekNumbers.forEach((w) => {
    weekData[w] = { deliverables: [], liveSessions: [], announcementsCount: 0 };
  });

  Object.values(bundlesByCourse).forEach((courseBundles) => {
    courseBundles.forEach((bundle) => {
      const w = bundle.weekNumber;
      if (weekData[w]) {
        weekData[w].deliverables.push(...bundle.deliverables);
        weekData[w].liveSessions.push(...bundle.liveSessions);
        weekData[w].announcementsCount += bundle.announcements.length;
      }
    });
  });

  // Timeline events for the chronological list
  const timelineEvents: Array<{
    id: string;
    type: "deliverable" | "live";
    date: Date;
    dateFormatted: string;
    title: string;
    courseCode: string;
    courseName: string;
    status?: string;
    url: string;
    points?: number;
    isCompleted?: boolean;
  }> = [];

  deliverables.forEach((d) => {
    const isFinished = d.status === "graded" || d.status === "submitted" || d.isCompleted;
    if (d.dueAt) {
      timelineEvents.push({
        id: d.id,
        type: "deliverable",
        date: new Date(d.dueAt),
        dateFormatted: new Date(d.dueAt).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        title: d.title,
        courseCode: d.courseCode,
        courseName: d.courseName,
        status: d.status,
        url: d.canvasUrl,
        points: d.pointsPossible,
        isCompleted: isFinished,
      });
    }
  });

  liveSessions.forEach((s) => {
    timelineEvents.push({
      id: s.id,
      type: "live",
      date: new Date(s.startAt),
      dateFormatted: new Date(s.startAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      title: s.title,
      courseCode: s.courseCode,
      courseName: s.courseName,
      url: s.zoomUrl || s.canvasUrl,
    });
  });

  timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // In timeline mode, all events are displayed chronologically
  const displayedTimelineEvents = timelineEvents;

  return (
    <div className="space-y-6">
      {/* Master Calendar Header Card */}
      <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Master Term Schedule
            </h2>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
              Unified cross-instance timeline for Kenan-Flagler Online MBA
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher: Term Roadmap vs Timeline Stream */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-md border border-border">
              <button
                type="button"
                onClick={() => handleFilterChange("weeks")}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeFilter === "weeks"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Term Roadmap
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("timeline")}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeFilter === "timeline"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Timeline Stream ({timelineEvents.length})
              </button>
            </div>

            {/* Export .ICS Button */}
            <button
              type="button"
              onClick={onExportICS}
              className="h-9 px-3.5 rounded-md bg-card border border-border hover:bg-muted/40 text-foreground text-xs sm:text-sm font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 shadow-2xs"
              title="Export all deadlines to Apple Calendar or Google Calendar"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export .ICS</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: 5-WEEK TERM ROADMAP (Comprehensive, Never Blank) */}
      {activeFilter === "weeks" && (
        <div className="space-y-6">
          {weekNumbers.map((w) => {
            const data = weekData[w];
            const weekDelivs = data?.deliverables || [];
            const weekLives = data?.liveSessions || [];

            return (
              <div
                key={w}
                className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden"
              >
                {/* Week Header Banner */}
                <div className="p-4 sm:p-5 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold uppercase px-2.5 py-1 rounded bg-primary text-primary-foreground shadow-2xs">
                      WEEK {w}
                    </span>
                    <span className="text-base sm:text-lg font-semibold text-foreground">
                      Module Milestones & Deliverables
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-muted-foreground">
                    <span>
                      {weekDelivs.length} {weekDelivs.length === 1 ? "deliverable" : "deliverables"}
                    </span>
                    <span>•</span>
                    <span>
                      {weekLives.length} {weekLives.length === 1 ? "live session" : "live sessions"}
                    </span>
                  </div>
                </div>

                {/* Week Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Live Sessions if any */}
                  {weekLives.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Live Synchronous Sessions:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {weekLives.map((session) => (
                          <div
                            key={session.id}
                            className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/10 flex items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <span className="text-xs font-semibold uppercase text-purple-900 dark:text-purple-300">
                                {getCleanCourseName(session.courseCode, session.courseName)}
                              </span>
                              <h4 className="text-sm font-semibold text-foreground truncate">
                                {session.title}
                              </h4>
                            </div>
                            {session.zoomUrl && (
                              <a
                                href={session.zoomUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="h-8 px-3 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Join Zoom</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deliverables for this week */}
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Assignments & Memos:
                    </span>
                    {weekDelivs.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground py-1">
                        No graded assignments assigned for Week {w}.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/50 border border-border/70 rounded-md overflow-hidden bg-card">
                        {weekDelivs.map((deliv) => {
                          const courseColor = getCourseColor(deliv.courseCode);
                          const isFinished =
                            deliv.status === "graded" || deliv.status === "submitted" || deliv.isCompleted;

                          return (
                            <div
                              key={deliv.id}
                              className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-muted/10 ${
                                isFinished ? "opacity-70 bg-muted/5" : ""
                              }`}
                            >
                              {/* Checkbox */}
                              {onToggleCompleteItem && (
                                <button
                                  type="button"
                                  onClick={() => onToggleCompleteItem(deliv.id)}
                                  aria-label={`Mark ${deliv.title} as ${isFinished ? "incomplete" : "complete"}`}
                                  className={`mt-0.5 flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded-sm border-2 transition-all cursor-pointer ${
                                    isFinished
                                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                                      : "border-border bg-card hover:border-primary"
                                  }`}
                                >
                                  {isFinished && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                              )}

                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                                  >
                                    {getCleanCourseName(deliv.courseCode, deliv.courseName)}
                                  </span>
                                  <h4
                                    className={`text-sm sm:text-base font-semibold ${
                                      isFinished ? "text-muted-foreground line-through" : "text-foreground"
                                    }`}
                                  >
                                    {deliv.title}
                                  </h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-mono">
                                    {deliv.dueAt
                                      ? new Date(deliv.dueAt).toLocaleDateString("en-US", {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })
                                      : "No official due date set"}
                                  </span>
                                  {deliv.pointsPossible > 0 && (
                                    <span className="font-mono font-semibold">
                                      • {deliv.pointsPossible} PTS
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0 self-center">
                                <a
                                  href={deliv.canvasUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="h-7 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                  title="View on Canvas"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: CHRONOLOGICAL TIMELINE STREAM */}
      {activeFilter === "timeline" && (
        <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Chronological Agenda Stream
            </h3>
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {displayedTimelineEvents.length}{" "}
              {displayedTimelineEvents.length === 1 ? "dated event" : "dated events"}
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {displayedTimelineEvents.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground">
                No dated events found. Try switching to the Term Roadmap view.
              </div>
            ) : (
              displayedTimelineEvents.map((evt) => {
                const courseColor = getCourseColor(evt.courseCode);
                return (
                  <div
                    key={evt.id}
                    className={`p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 transition-colors hover:bg-muted/10 ${
                      evt.isCompleted ? "opacity-70 bg-muted/5" : ""
                    }`}
                  >
                    {/* Checkbox for deliverables */}
                    {onToggleCompleteItem && evt.type !== "live" && (
                      <button
                        type="button"
                        onClick={() => onToggleCompleteItem(evt.id)}
                        aria-label={`Mark ${evt.title} as ${evt.isCompleted ? "incomplete" : "complete"}`}
                        className={`mt-0.5 sm:mt-0 flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded-sm border-2 transition-all cursor-pointer ${
                          evt.isCompleted
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                            : "border-border bg-card hover:border-primary"
                        }`}
                      >
                        {evt.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    )}

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                        >
                          {getCleanCourseName(evt.courseCode, evt.courseName)}
                        </span>
                        <h4
                          className={`text-sm sm:text-base font-semibold ${
                            evt.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                          }`}
                        >
                          {evt.title}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono font-semibold text-foreground/80">
                          {evt.dateFormatted}
                        </span>
                        {evt.points !== undefined && (
                          <span className="font-mono">• {evt.points} PTS</span>
                        )}
                        {evt.type === "live" && (
                          <span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">
                            • LIVE ZOOM
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 self-center">
                      {evt.type === "live" ? (
                        <a
                          href={evt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-2.5 rounded border border-purple-600/40 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title="Join Zoom session"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Zoom</span>
                        </a>
                      ) : (
                        <a
                          href={evt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title="View on Canvas"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
