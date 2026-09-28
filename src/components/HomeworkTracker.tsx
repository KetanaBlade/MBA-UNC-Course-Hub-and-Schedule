"use client";

import React from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { DeliverableStatus, NormalizedDeliverable } from "@/lib/canvas/types";

interface HomeworkTrackerProps {
  deliverables: NormalizedDeliverable[];
  weekNumber: number;
}

export function HomeworkTracker({ deliverables, weekNumber }: HomeworkTrackerProps) {
  const getStatusBadge = (status: DeliverableStatus, score?: number | null, grade?: string | null) => {
    switch (status) {
      case "graded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Graded {grade ? `(${grade})` : score !== null && score !== undefined ? `(${score} pts)` : ""}
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Submitted
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            Due Soon
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            To Do
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
        return `Was due ${dateStr} (${Math.abs(deliv.dueInDays)} days ago)`;
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
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">
        <GraduationCap className="mx-auto h-6 w-6 text-slate-400 mb-1.5 opacity-60" />
        No homework deliverables assigned for Week {weekNumber}.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
            <GraduationCap className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Week {weekNumber} Homework & Deliverables
          </h3>
        </div>
        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {deliverables.length} {deliverables.length === 1 ? "deliverable" : "deliverables"}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {deliverables.map((deliv) => {
          return (
            <div
              key={deliv.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 transition hover:bg-slate-50/50"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-sm bg-[#13294B] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    {deliv.courseCode}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                    {deliv.title}
                  </h4>
                  {getStatusBadge(deliv.status, deliv.score, deliv.grade)}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDueText(deliv)}
                  </span>
                  {deliv.pointsPossible > 0 && (
                    <span className="tabular-nums font-semibold text-slate-700">
                      • {deliv.pointsPossible} points
                    </span>
                  )}
                </div>
              </div>

              {/* Submit / View Link */}
              <div className="shrink-0 self-end sm:self-center">
                <a
                  href={deliv.canvasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-xs transition active:scale-95 ${
                    deliv.status === "graded" || deliv.status === "submitted"
                      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      : "bg-[#13294B] text-white hover:bg-[#1a3866]"
                  }`}
                >
                  <span>
                    {deliv.status === "graded" || deliv.status === "submitted"
                      ? "View Submission"
                      : "Submit on Canvas"}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#4B9CD3]" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
