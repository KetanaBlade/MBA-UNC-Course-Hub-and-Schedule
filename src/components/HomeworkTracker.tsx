"use client";

import React from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { DeliverableStatus, NormalizedDeliverable } from "@/lib/canvas/types";

interface HomeworkTrackerProps {
  deliverables: NormalizedDeliverable[];
  weekNumber: number;
}

export function HomeworkTracker({ deliverables, weekNumber }: HomeworkTrackerProps) {
  const getStatusChip = (status: DeliverableStatus, score?: number | null, grade?: string | null) => {
    switch (status) {
      case "graded":
        return (
          <span className="micro-tag bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-2.5 w-2.5" />
            GRADED {grade ? `(${grade})` : score !== null && score !== undefined ? `(${score} PTS)` : ""}
          </span>
        );
      case "submitted":
        return (
          <span className="micro-tag bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-2.5 w-2.5" />
            SUBMITTED
          </span>
        );
      case "upcoming":
        return (
          <span className="micro-tag bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <Clock className="h-2.5 w-2.5" />
            DUE SOON
          </span>
        );
      case "overdue":
        return (
          <span className="micro-tag bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            <AlertTriangle className="h-2.5 w-2.5" />
            OVERDUE
          </span>
        );
      default:
        return (
          <span className="micro-tag bg-muted text-muted-foreground border border-border">
            TO DO
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
        return `Was due ${dateStr} (${Math.abs(deliv.dueInDays)}d ago)`;
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
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
        <GraduationCap className="mx-auto h-5 w-5 text-muted-foreground/60 mb-1.5" />
        No homework deliverables assigned for Week {weekNumber}.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
      {/* Outer Card Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
            <GraduationCap className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-foreground">
            Week {weekNumber} Homework & Deliverables
          </h3>
        </div>
        <span className="micro-tag bg-muted text-muted-foreground">
          {deliverables.length} {deliverables.length === 1 ? "DELIVERABLE" : "DELIVERABLES"}
        </span>
      </div>

      {/* De-boxified List Rows */}
      <div className="divide-y divide-border">
        {deliverables.map((deliv) => {
          return (
            <div
              key={deliv.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 transition hover:bg-muted/30"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="micro-tag bg-primary text-primary-foreground font-mono">
                    {deliv.courseCode}
                  </span>
                  <h4 className="text-sm font-bold text-foreground leading-snug">
                    {deliv.title}
                  </h4>
                  {getStatusChip(deliv.status, deliv.score, deliv.grade)}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="h-3 w-3 opacity-70" />
                    {formatDueText(deliv)}
                  </span>
                  {deliv.pointsPossible > 0 && (
                    <span className="font-mono text-[11px] tabular-nums font-semibold text-foreground/90">
                      • {deliv.pointsPossible} PTS
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 self-end sm:self-center">
                <a
                  href={deliv.canvasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`btn-tactile inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold shadow-2xs transition ${
                    deliv.status === "graded" || deliv.status === "submitted"
                      ? "border border-border bg-muted/40 hover:bg-muted text-foreground"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  <span>
                    {deliv.status === "graded" || deliv.status === "submitted"
                      ? "View Submission"
                      : "Submit on Canvas"}
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
