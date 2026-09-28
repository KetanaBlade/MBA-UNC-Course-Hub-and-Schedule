"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { DeliverableStatus, NormalizedDeliverable } from "@/lib/canvas/types";
import { getCourseColor } from "@/lib/courseColors";

interface HomeworkTrackerProps {
  deliverables: NormalizedDeliverable[];
  weekNumber: number;
}

export function HomeworkTracker({ deliverables, weekNumber }: HomeworkTrackerProps) {
  const [showAll, setShowAll] = useState(false);

  const getStatusBadge = (status: DeliverableStatus, score?: number | null, grade?: string | null) => {
    switch (status) {
      case "graded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>GRADED {grade ? `(${grade})` : score !== null && score !== undefined ? `(${score} PTS)` : ""}</span>
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>SUBMITTED</span>
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>DUE SOON</span>
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-destructive/15 text-destructive border border-destructive/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>OVERDUE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-muted/70 text-foreground border border-border">
            <span>TO DO</span>
          </span>
        );
    }
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

    if (deliv.status === "graded" || deliv.status === "submitted") {
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

  if (deliverables.length === 0) {
    return (
      <div className="border border-border rounded-lg bg-card p-5 text-center text-xs sm:text-sm text-muted-foreground shadow-xs">
        No homework deliverables assigned for Week {weekNumber}.
      </div>
    );
  }

  const visibleDeliverables = showAll ? deliverables : deliverables.slice(0, 5);

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
      {/* Clean Header: No icon, no awkward wrapping badge */}
      <div className="p-4 sm:p-5 border-b border-border bg-card">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            Week {weekNumber} Homework
          </h2>
          <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
            {deliverables.length} {deliverables.length === 1 ? "deliverable" : "deliverables"}
          </span>
        </div>
        <p className="text-xs sm:text-[13px] text-muted-foreground mt-1">
          Graded assignments, case memos, and quizzes
        </p>
      </div>

      {/* Scannable Deliverables List */}
      <div className="divide-y divide-border/60">
        {visibleDeliverables.map((deliv) => {
          const courseColor = getCourseColor(deliv.courseCode);
          const isFinished = deliv.status === "graded" || deliv.status === "submitted";

          return (
            <div
              key={deliv.id}
              className={`p-4 flex flex-col gap-2.5 transition-colors hover:bg-muted/10 ${
                isFinished ? "opacity-75" : ""
              }`}
            >
              <div className="space-y-1.5">
                {/* Line 1: Course code + Status badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                  >
                    {deliv.courseCode}
                  </span>
                  {getStatusBadge(deliv.status, deliv.score, deliv.grade)}
                </div>

                {/* Line 2: Title */}
                <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug tracking-tight">
                  {deliv.title}
                </h3>

                {/* Line 3: Due date + Points metadata */}
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-mono text-xs">
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    {formatDueText(deliv)}
                  </span>
                  {deliv.pointsPossible > 0 && (
                    <span className="font-mono text-xs tabular-nums font-semibold text-foreground/80">
                      • {deliv.pointsPossible} PTS
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <a
                  href={deliv.canvasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`h-8 px-3 rounded-md text-xs font-bold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${
                    isFinished
                      ? "border border-border bg-card hover:bg-muted/30 text-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  <span>{isFinished ? "View Submission" : "Submit on Canvas"}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more button if > 5 */}
      {deliverables.length > 5 && !showAll && (
        <div className="p-3 border-t border-border bg-muted/5 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Show all {deliverables.length} deliverables
          </button>
        </div>
      )}
    </div>
  );
}
