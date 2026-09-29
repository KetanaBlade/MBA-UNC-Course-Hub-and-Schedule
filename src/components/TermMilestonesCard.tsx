"use client";

import React from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { DeliverableStatus, NormalizedDeliverable } from "@/lib/canvas/types";
import { getCourseColor, getCleanCourseName } from "@/lib/courseColors";

interface TermMilestonesCardProps {
  deliverables: NormalizedDeliverable[];
  onToggleComplete: (id: string) => void;
}

export function TermMilestonesCard({
  deliverables,
  onToggleComplete,
}: TermMilestonesCardProps) {
  const getStatusBadge = (
    status: DeliverableStatus,
    score?: number | null,
    grade?: string | null,
    isCompleted?: boolean
  ) => {
    if (status === "graded") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>GRADED {grade ? `(${grade})` : score !== null && score !== undefined ? `(${score}P)` : ""}</span>
        </span>
      );
    }
    if (status === "submitted" || isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
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
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30">
          <AlertTriangle className="w-3 h-3" />
          <span>OVERDUE</span>
        </span>
      );
    }
    return null;
  };

  const formatDueText = (deliv: NormalizedDeliverable) => {
    if (!deliv.dueAt) return "Date TBA";
    const dateObj = new Date(deliv.dueAt);
    if (isNaN(dateObj.getTime())) return "Date TBA";

    const dateStr = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return dateStr;
  };

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col h-full min-h-0 transition-all">
      {/* Executive Card Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
              Term Projects & Milestones{" "}
              <span className="text-primary font-mono text-sm sm:text-base font-semibold">
                ({deliverables.length})
              </span>
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
            Major deliverables
          </span>
        </div>
      </div>

      {/* Deliverables List (Scrollable) */}
      <div className="overflow-y-auto max-h-[300px] xl:max-h-[340px] divide-y divide-border/60 flex-1 min-h-0">
        {deliverables.length === 0 ? (
          <div className="p-6 text-center text-xs sm:text-sm text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">No active term projects.</p>
            <p className="text-xs text-muted-foreground">
              All major milestones for selected courses are complete or not yet scheduled.
            </p>
          </div>
        ) : (
          deliverables.map((deliv) => {
            const courseColor = getCourseColor(deliv.courseCode);
            const isFinished =
              deliv.status === "graded" || deliv.status === "submitted" || deliv.isCompleted;

            return (
              <div
                key={`term-deliv-${deliv.id}`}
                className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors hover:bg-muted/10 ${
                  isFinished ? "opacity-60 bg-muted/5" : "bg-card"
                }`}
              >
                {/* Tactile Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleComplete(deliv.id)}
                  aria-label={`Mark ${deliv.title} as ${isFinished ? "incomplete" : "complete"}`}
                  className={`mt-0.5 flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded-sm border-2 transition-all cursor-pointer ${
                    isFinished
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                      : "border-border bg-card hover:border-primary shadow-2xs"
                  }`}
                >
                  {isFinished && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Content Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Line 1: Due Date + Status */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground font-semibold">
                      <Calendar className="w-3.5 h-3.5 opacity-70" />
                      {formatDueText(deliv)}
                    </span>
                    {getStatusBadge(deliv.status, deliv.score, deliv.grade, deliv.isCompleted)}
                  </div>

                  {/* Line 2: Title */}
                  <h3
                    className={`text-sm sm:text-base font-semibold leading-snug tracking-tight ${
                      isFinished ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {deliv.title}
                  </h3>

                  {/* Line 3: Course Tag + Points + Countdown */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                    >
                      {getCleanCourseName(deliv.courseCode, deliv.courseName)}
                    </span>
                    {deliv.pointsPossible > 0 && (
                      <span className="font-mono text-xs tabular-nums font-semibold text-foreground/80">
                        • {deliv.pointsPossible} PTS
                      </span>
                    )}
                    {deliv.dueInDays !== undefined && (
                      <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
                        • {deliv.dueInDays}d left
                      </span>
                    )}
                  </div>

                  {/* Line 4: Action Button */}
                  <div className="pt-0.5">
                    <a
                      href={deliv.canvasUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      title="View on Canvas"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
