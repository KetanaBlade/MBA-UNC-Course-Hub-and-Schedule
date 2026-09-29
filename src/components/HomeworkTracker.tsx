"use client";

import React from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Video,
} from "lucide-react";
import { DeliverableStatus, NormalizedDeliverable, NormalizedLiveSession } from "@/lib/canvas/types";
import { getCourseColor, getCleanCourseCode } from "@/lib/courseColors";

interface HomeworkTrackerProps {
  deliverables: NormalizedDeliverable[];
  liveSessions?: NormalizedLiveSession[];
  weekNumber: number;
  onToggleComplete: (id: string) => void;
}

export function HomeworkTracker({
  deliverables,
  liveSessions = [],
  weekNumber,
  onToggleComplete,
}: HomeworkTrackerProps) {
  const getStatusBadge = (
    status: DeliverableStatus,
    score?: number | null,
    grade?: string | null,
    isCompleted?: boolean
  ) => {
    if (status === "graded") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>GRADED {grade ? `(${grade})` : score !== null && score !== undefined ? `(${score} pts)` : ""}</span>
        </span>
      );
    }
    if (status === "submitted" || isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>DONE</span>
        </span>
      );
    }
    if (status === "upcoming") {
      return null;
    }
    if (status === "overdue") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30">
          <AlertTriangle className="w-3 h-3" />
          <span>OVERDUE</span>
        </span>
      );
    }
    return null;
  };

  const formatDueText = (deliv: NormalizedDeliverable) => {
    if (!deliv.dueAt) return "No due date set";
    const dateObj = new Date(deliv.dueAt);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    if (deliv.status === "graded" || deliv.status === "submitted" || deliv.isCompleted) {
      return `Due: ${dateStr}`;
    }

    if (deliv.dueInDays !== undefined) {
      if (deliv.dueInDays < 0) {
        return `Overdue: was due ${dateStr} (${Math.abs(deliv.dueInDays)}d ago)`;
      }
      if (deliv.dueInDays === 0) {
        return `Due today at ${dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      }
      if (deliv.dueInDays === 1) {
        return `Due tomorrow at ${dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      }
      return `Due in ${deliv.dueInDays} days (${dateStr})`;
    }

    return `Due: ${dateStr}`;
  };

  const formatSessionSchedule = (startAt?: string, endAt?: string) => {
    if (!startAt) return `Week ${weekNumber} Synchronous Class`;
    try {
      const start = new Date(startAt);
      if (isNaN(start.getTime())) return `Week ${weekNumber} Synchronous Class`;

      const datePart = start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const timePart = start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      if (endAt) {
        const end = new Date(endAt);
        if (!isNaN(end.getTime())) {
          const endTimePart = end.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });
          return `${datePart} • ${timePart} – ${endTimePart}`;
        }
      }
      return `${datePart} • ${timePart}`;
    } catch {
      return `Week ${weekNumber} Synchronous Class`;
    }
  };

  const totalCount = deliverables.length + liveSessions.length;

  // Defensive chronological sort: earliest first
  const sortedLiveSessions = [...liveSessions].sort((a, b) => {
    if (!a.startAt && !b.startAt) return 0;
    if (!a.startAt) return 1;
    if (!b.startAt) return -1;
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  const sortedDeliverables = [...deliverables].sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return 0;
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

  if (totalCount === 0) {
    return (
      <div className="border border-border rounded-lg bg-card p-5 text-center text-xs sm:text-sm text-muted-foreground shadow-xs">
        No assignments or live sessions scheduled for Week {weekNumber}.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col transition-all">
      {/* Clean Full-Width Sticky Header */}
      <div className="sticky top-0 z-10 p-4 sm:p-5 border-b border-border bg-card shrink-0">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
          Week {weekNumber} Assignments and Live Sessions{" "}
          <span className="text-primary text-base font-semibold tabular-nums">
            ({totalCount})
          </span>
        </h2>
      </div>

      {/* Scannable Deliverables & Live Sessions List */}
      <div className="overflow-y-auto max-h-[760px] divide-y divide-border/60 flex-1 min-h-0">
        {/* Live Synchronous Sessions from Canvas Calendar */}
        {sortedLiveSessions.map((session) => {
          const courseColor = getCourseColor(session.courseCode);
          const cleanCode = getCleanCourseCode(session.courseCode, session.courseName);

          return (
            <div
              key={session.id}
              className="p-3.5 sm:p-4 flex items-start gap-3 transition-colors hover:bg-purple-500/10 bg-purple-500/5"
            >
              {/* Visual Indicator Icon */}
              <div className="mt-0.5 flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded bg-purple-500/20 text-purple-700 dark:text-purple-300">
                <Video className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              <div className="space-y-1 flex-1 min-w-0 pr-1">
                {/* Line 1: Live Status Badge + Schedule */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
                    <Clock className="w-3.5 h-3.5 opacity-75" />
                    Live Zoom
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    • {formatSessionSchedule(session.startAt, session.endAt)}
                  </span>
                </div>

                {/* Line 2: Title */}
                <h3 className="text-xs sm:text-sm font-semibold text-foreground leading-snug tracking-tight">
                  {session.title}
                </h3>

                {/* Line 3: Course Code & Location */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs border ${courseColor.badge}`}
                  >
                    {cleanCode}
                  </span>
                  {session.location && !session.location.includes("http") && (
                    <span className="text-xs text-muted-foreground">
                      • {session.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 self-center">
                <a
                  href={session.zoomUrl || session.canvasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-7 px-2.5 rounded border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-900 dark:text-purple-200 text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                  title={session.zoomUrl ? "Join live Zoom session" : "View session details in Canvas Calendar"}
                >
                  <span>{session.zoomUrl ? "Join Zoom" : "View"}</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              </div>
            </div>
          );
        })}

        {/* Deliverables */}
        {sortedDeliverables.map((deliv) => {
          const courseColor = getCourseColor(deliv.courseCode);
          const cleanCode = getCleanCourseCode(deliv.courseCode, deliv.courseName);
          const isFinished =
            deliv.status === "graded" || deliv.status === "submitted" || deliv.isCompleted;

          return (
            <div
              key={deliv.id}
              className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors hover:bg-muted/10 ${
                isFinished ? "opacity-70 bg-muted/5" : ""
              }`}
            >
              {/* Tactile Checkbox */}
              <button
                type="button"
                onClick={() => onToggleComplete(deliv.id)}
                aria-label={`Mark ${deliv.title} as ${isFinished ? "incomplete" : "complete"}`}
                className={`mt-0.5 flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded border-2 transition-all cursor-pointer ${
                  isFinished
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                    : "border-border bg-card hover:border-primary shadow-2xs"
                }`}
              >
                {isFinished && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div className="space-y-1 flex-1 min-w-0 pr-1">
                {/* Line 1: Due date + Status badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    {formatDueText(deliv)}
                  </span>
                  {getStatusBadge(deliv.status, deliv.score, deliv.grade, deliv.isCompleted)}
                </div>

                {/* Line 2: Title */}
                <h3
                  className={`text-xs sm:text-sm font-semibold leading-snug tracking-tight ${
                    isFinished ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {deliv.title}
                </h3>

                {/* Line 3: Course code + Points metadata */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-xs border ${courseColor.badge}`}
                  >
                    {cleanCode}
                  </span>
                  {deliv.pointsPossible > 0 && (
                    <span className="text-xs tabular-nums text-muted-foreground font-medium">
                      • {deliv.pointsPossible} pts
                    </span>
                  )}
                </div>
              </div>

              {/* View Action Button */}
              <div className="shrink-0 self-start mt-0.5">
                <a
                  href={deliv.canvasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                  title="View on Canvas"
                >
                  <span>View</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
