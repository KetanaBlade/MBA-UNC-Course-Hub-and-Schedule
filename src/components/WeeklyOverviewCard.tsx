"use client";

import React, { useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Video,
} from "lucide-react";
import { NormalizedAnnouncement } from "@/lib/canvas/types";

interface WeeklyOverviewCardProps {
  announcements: NormalizedAnnouncement[];
  weekNumber: number;
}

export function WeeklyOverviewCard({ announcements, weekNumber }: WeeklyOverviewCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    announcements[0]?.id || null
  );

  if (!announcements || announcements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">
        <Bell className="mx-auto h-6 w-6 text-slate-400 mb-1.5 opacity-60" />
        No specific announcements posted for Week {weekNumber} yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
            <Bell className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Week {weekNumber} Briefings & Professor Notes
          </h3>
        </div>
        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {announcements.length} {announcements.length === 1 ? "announcement" : "announcements"}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {announcements.map((ann) => {
          const isExpanded = expandedId === ann.id;
          return (
            <div key={ann.id} className="p-4 sm:p-5 transition hover:bg-slate-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                    {ann.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {ann.authorName}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(ann.postedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {ann.zoomUrl && (
                    <a
                      href={ann.zoomUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#4B9CD3] px-3 py-1.5 text-xs font-semibold text-[#13294B] shadow-xs hover:bg-[#6baee0] transition active:scale-95"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Join Zoom</span>
                    </a>
                  )}

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label={isExpanded ? "Collapse announcement" : "Expand announcement"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message Body */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div
                    className="prose prose-sm max-w-none text-xs text-slate-700 leading-relaxed [&_a]:text-[#4B9CD3] [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: ann.message }}
                  />
                  <div className="mt-3 flex justify-end">
                    <a
                      href={ann.canvasUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#13294B]"
                    >
                      View on Canvas <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
