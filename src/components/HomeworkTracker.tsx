"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import { DeliverableStatus, NormalizedDeliverable } from "@/lib/canvas/types";

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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>GRADED {grade ? `(${grade})` : score !== null && score !== undefined ? `(${score} PTS)` : ""}</span>
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>SUBMITTED</span>
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>DUE SOON</span>
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>OVERDUE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-muted/60 text-muted-foreground border border-border/80">
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
      <div className="border border-border/70 rounded-lg bg-card p-6 text-center text-xs text-muted-foreground shadow-xs">
        <GraduationCap className="mx-auto w-5 h-5 text-muted-foreground/60 mb-1.5" />
        No homework deliverables assigned for Week {weekNumber}.
      </div>
    );
  }

  const visibleDeliverables = showAll ? deliverables : deliverables.slice(0, 4);

  return (
    <div className="border border-border/70 rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
      {/* Card Header (Recipe 5.2) */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/40 bg-card">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground tracking-tight font-sans">
              Week {weekNumber} Homework & Deliverables
            </h2>
          </div>
          <p className="text-sm font-medium text-muted-foreground font-sans">
            Assignments, case memos, and quizzes pulled into weekly context
          </p>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-muted/60 border border-border/80 text-muted-foreground">
          {deliverables.length} {deliverables.length === 1 ? "DELIVERABLE" : "DELIVERABLES"}
        </span>
      </div>

      {/* De-boxified List Rows */}
      <div className="divide-y divide-border/40">
        {visibleDeliverables.map((deliv) => {
          return (
            <div
              key={deliv.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition hover:bg-muted/10"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Line 1: Course code + Status badge */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20">
                    {deliv.courseCode}
                  </span>
                  {getStatusBadge(deliv.status, deliv.score, deliv.grade)}
                </div>
                {/* Line 2: Title - prominent, scannable */}
                <h3 className="text-sm font-bold text-foreground leading-snug tracking-tight">
                  {deliv.title}
                </h3>
                {/* Line 3: Due date + Points metadata */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="w-3 h-3 opacity-60" />
                    {formatDueText(deliv)}
                  </span>
                  {deliv.pointsPossible > 0 && (
                    <span className="font-mono text-[11px] tabular-nums font-semibold text-foreground/70">
                      • {deliv.pointsPossible} pts
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 self-end sm:self-start sm:mt-1">
                <a
                  href={deliv.canvasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`h-8 px-3 rounded-md text-xs font-bold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 ${
                    deliv.status === "graded" || deliv.status === "submitted"
                      ? "border border-border bg-card hover:bg-muted/40 text-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  <span>
                    {deliv.status === "graded" || deliv.status === "submitted"
                      ? "View Submission"
                      : "Submit on Canvas"}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      
      {deliverables.length > 4 && !showAll && (
        <div className="p-3 border-t border-border/40 bg-muted/5 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/20"
          >
            Show all {deliverables.length} deliverables
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
