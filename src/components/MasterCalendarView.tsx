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
    <div className="border border-border/70 rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
      {/* Card Header (Recipe 5.2) */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 bg-card">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground tracking-tight font-sans">
              Master Term Schedule
            </h2>
          </div>
          <p className="text-sm font-medium text-muted-foreground font-sans">
            Unified cross-instance timeline for Kenan-Flagler Online MBA
          </p>
        </div>

        {/* Anchored Controls (Recipe 5.3) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-muted/40 p-0.5 rounded-md border border-border/50">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                filter === "all" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                filter === "upcoming" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("deliverables")}
              className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                filter === "deliverables" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Due Dates
            </button>
            <button
              onClick={() => setFilter("live")}
              className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                filter === "live" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Zoom
            </button>
          </div>

          <button
            onClick={onExportICS}
            className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>.ICS</span>
          </button>
        </div>
      </div>

      {/* De-boxified Event Stream */}
      <div className="divide-y divide-border/40">
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
                className={`p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 transition hover:bg-muted/15 ${
                  isPast ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`mt-0.5 sm:mt-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      evt.type === "live"
                        ? "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                        : evt.status === "graded" || evt.status === "submitted"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {evt.type === "live" ? (
                      <Video className="w-4 h-4" />
                    ) : evt.status === "graded" || evt.status === "submitted" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20">
                        {evt.courseCode}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug font-sans">
                        {evt.title}
                      </h3>
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
                        <span className="text-[11px] text-muted-foreground">
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
                    className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1"
                  >
                    <span>{evt.type === "live" ? "Join Zoom" : "Open"}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
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
