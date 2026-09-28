"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
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

  // Combine and sort events
  const timelineEvents: Array<{
    id: string;
    type: "deliverable" | "live";
    date: Date;
    title: string;
    courseCode: string;
    courseName: string;
    badge?: string;
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
        extraInfo: `${d.pointsPossible} points`,
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

  // Sort chronological
  timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Filter
  const now = new Date();
  const filteredEvents = timelineEvents.filter((event) => {
    if (filter === "upcoming" && event.date.getTime() < now.getTime()) return false;
    if (filter === "deliverables" && event.type !== "deliverable") return false;
    if (filter === "live" && event.type !== "live") return false;
    return true;
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
            <CalendarIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Master Term Calendar & Deadlines
            </h3>
            <p className="text-[11px] text-slate-500">
              Unified schedule across DigitalCampus and Kenan-Flagler
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                filter === "all" ? "bg-[#13294B] text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                filter === "upcoming"
                  ? "bg-[#13294B] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("deliverables")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                filter === "deliverables"
                  ? "bg-[#13294B] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Due Dates
            </button>
            <button
              onClick={() => setFilter("live")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                filter === "live"
                  ? "bg-[#13294B] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Zoom
            </button>
          </div>

          <button
            onClick={onExportICS}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="h-3 w-3 text-[#4B9CD3]" />
            <span>.ics</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="divide-y divide-slate-100">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No events match the selected filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isPast = evt.date.getTime() < now.getTime();
            return (
              <div
                key={evt.id}
                className={`flex items-start sm:items-center justify-between gap-3 p-4 transition sm:px-5 hover:bg-slate-50/50 ${
                  isPast ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`mt-0.5 sm:mt-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      evt.type === "live"
                        ? "bg-purple-100 text-purple-700"
                        : evt.status === "graded" || evt.status === "submitted"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {evt.type === "live" ? (
                      <Video className="h-4 w-4" />
                    ) : evt.status === "graded" || evt.status === "submitted" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm bg-[#13294B] px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                        {evt.courseCode}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                        {evt.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">
                        {evt.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {evt.extraInfo && <span>• {evt.extraInfo}</span>}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <a
                    href={evt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    <span>{evt.type === "live" ? "Open Zoom" : "Open"}</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
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
