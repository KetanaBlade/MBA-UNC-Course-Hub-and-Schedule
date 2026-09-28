"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Video,
} from "lucide-react";
import { NormalizedDeliverable, NormalizedLiveSession } from "@/lib/canvas/types";

interface MasterCalendarViewProps {
  deliverables: NormalizedDeliverable[];
  liveSessions: NormalizedLiveSession[];
  onExportICS: () => void;
}

export function MasterCalendarView({
  deliverables,
  liveSessions,
  onExportICS,
}: MasterCalendarViewProps) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "deliverables" | "live">("all");

  const timelineEvents: Array<{
    id: string;
    type: "deliverable" | "live";
    date: Date;
    title: string;
    courseCode: string;
    courseName: string;
    status?: string;
    url: string;
    extraInfo?: string;
  }> = [];

  deliverables.forEach((d) => {
    if (d.dueAt) {
      timelineEvents.push({
        id: d.id,
        type: "deliverable",
        date: new Date(d.dueAt),
        title: d.title,
        courseCode: d.courseCode,
        courseName: d.courseName,
        status: d.status,
        url: d.canvasUrl,
        extraInfo: `${d.pointsPossible} pts`,
      });
    }
  });

  liveSessions.forEach((s) => {
    timelineEvents.push({
      id: s.id,
      type: "live",
      date: new Date(s.startAt),
      title: s.title,
      courseCode: s.courseCode,
      courseName: s.courseName,
      url: s.zoomUrl || s.canvasUrl,
      extraInfo: "Live Class via Zoom",
    });
  });

  timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const now = new Date();
  const filteredEvents = timelineEvents.filter((event) => {
    if (filter === "upcoming" && event.date.getTime() < now.getTime()) return false;
    if (filter === "deliverables" && event.type !== "deliverable") return false;
    if (filter === "live" && event.type !== "live") return false;
    return true;
  });

  return (
    <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
      {/* Outer Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
            <CalendarIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">
              Master Term Schedule
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Unified cross-instance timeline for Kenan-Flagler Online MBA
            </p>
          </div>
        </div>

        {/* Anchored Filter Toolbar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`btn-tactile rounded-[4px] px-2.5 py-1 font-bold transition ${
                filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`btn-tactile rounded-[4px] px-2.5 py-1 font-bold transition ${
                filter === "upcoming"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("deliverables")}
              className={`btn-tactile rounded-[4px] px-2.5 py-1 font-bold transition ${
                filter === "deliverables"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Due Dates
            </button>
            <button
              onClick={() => setFilter("live")}
              className={`btn-tactile rounded-[4px] px-2.5 py-1 font-bold transition ${
                filter === "live"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Zoom
            </button>
          </div>

          <button
            onClick={onExportICS}
            className="btn-tactile inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 hover:bg-muted px-2.5 py-1 text-xs font-bold text-foreground shadow-2xs"
          >
            <Download className="h-3 w-3 text-[#4B9CD3]" />
            <span>.ICS</span>
          </button>
        </div>
      </div>

      {/* De-boxified Event Stream */}
      <div className="divide-y divide-border">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No events match the selected filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isPast = evt.date.getTime() < now.getTime();
            return (
              <div
                key={evt.id}
                className={`flex items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 transition hover:bg-muted/30 ${
                  isPast ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`mt-0.5 sm:mt-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      evt.type === "live"
                        ? "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                        : evt.status === "graded" || evt.status === "submitted"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {evt.type === "live" ? (
                      <Video className="h-3.5 w-3.5" />
                    ) : evt.status === "graded" || evt.status === "submitted" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="micro-tag bg-primary text-primary-foreground font-mono">
                        {evt.courseCode}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                        {evt.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono text-[11px] tabular-nums font-semibold text-foreground/80">
                        {evt.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {evt.extraInfo && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          • {evt.extraInfo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <a
                    href={evt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-tactile inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                  >
                    <span>{evt.type === "live" ? "Join Zoom" : "Open"}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/70" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
