"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>GRADED {grade ? `(${grade})` : score !== null && score !== undefined ? `(${score} PTS)` : ""}</span>
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>SUBMITTED</span>
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>DUE SOON</span>
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-destructive/15 text-destructive border border-destructive/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>OVERDUE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-muted/70 text-foreground border border-border">
            <span>TO DO</span>
          </span>
        );
    }
  };

  const formatDueText = (deliv: NormalizedDeliverable) => {
    if (!deliv.dueAt) return "No official due date set";
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
      <div className="border border-border rounded-lg bg-card p-6 text-center text-xs sm:text-sm text-muted-foreground shadow-xs">
        <GraduationCap className="mx-auto w-6 h-6 text-muted-foreground/60 mb-2" />
        No homework deliverables assigned for Week {weekNumber}.
      </div>
    );
  }

  const visibleDeliverables = showAll ? deliverables : deliverables.slice(0, 5);

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-tight font-sans">
              Week {weekNumber} Homework & Deliverables
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] font-medium text-muted-foreground font-sans">
            Graded assignments, case memos, and quizzes pulled into weekly context
          </p>
        </div>
        <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded-sm bg-muted/60 border border-border text-foreground">
          {deliverables.length} {deliverables.length === 1 ? "DELIVERABLE" : "DELIVERABLES"}
        </span>
      </div>

      {/* Scannable Deliverables List */}
      <div className="divide-y divide-border/60">
        {visibleDeliverables.map((deliv) => {
          const courseColor = getCourseColor(deliv.courseCode);
          const isFinished = deliv.status === "graded" || deliv.status === "submitted";

          return (
            <div
              key={deliv.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-muted/10 ${
                isFinished ? "opacity-75" : ""
              }`}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
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
                <h3 className="text-base font-bold text-foreground leading-snug tracking-tight font-sans">
                  {deliv.title}
                </h3>

                {/* Line 3: Due date + Points metadata */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-[13px] text-muted-foreground font-sans">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs">
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
              <div className="shrink-0 self-start sm:self-center">
                <a
                  href={deliv.canvasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`h-9 px-3.5 rounded-md text-xs sm:text-sm font-bold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 ${
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
