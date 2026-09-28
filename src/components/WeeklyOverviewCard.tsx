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
import { AnimatePresence, motion } from "framer-motion";
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
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
        <Bell className="mx-auto h-5 w-5 text-muted-foreground/60 mb-1.5" />
        No specific announcements posted for Week {weekNumber} yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
      {/* Outer Card Header */}
      <div className="flex items-center justify-between border-b border-border/80 bg-muted/20 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
            <Bell className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-foreground">
            Week {weekNumber} Briefings & Professor Notes
          </h3>
        </div>
        <span className="micro-tag bg-muted text-muted-foreground">
          {announcements.length} {announcements.length === 1 ? "NOTE" : "NOTES"}
        </span>
      </div>

      {/* De-boxified List Rows */}
      <div className="divide-y divide-border/60">
        {announcements.map((ann) => {
          const isExpanded = expandedId === ann.id;
          return (
            <div key={ann.id} className="p-4 sm:p-5 transition hover:bg-muted/10">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground leading-snug">
                    {ann.title}
                  </h4>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3 opacity-70" />
                      {ann.authorName}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">
                      {new Date(ann.postedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ann.zoomUrl && (
                    <a
                      href={ann.zoomUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactile inline-flex items-center gap-1.5 rounded-md bg-[#4B9CD3] px-3 py-1.5 text-xs font-bold text-[#13294B] shadow-2xs hover:bg-[#5aa8dd] transition"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Join Zoom</span>
                    </a>
                  )}

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                    className="btn-tactile rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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

              {/* Framer Motion Collapsible Accordion Body */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border/60">
                      <div
                        className="prose prose-sm max-w-none text-xs text-foreground/90 leading-relaxed [&_a]:text-[#4B9CD3] [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: ann.message }}
                      />
                      <div className="mt-3 flex justify-end">
                        <a
                          href={ann.canvasUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition"
                        >
                          View in Canvas <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
