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

  // Check if any announcement has a Zoom link
  const primaryZoom = announcements.find((a) => Boolean(a.zoomUrl));

  if (!announcements || announcements.length === 0) {
    return (
      <div className="border border-border rounded-lg bg-card p-6 text-center text-xs sm:text-sm text-muted-foreground shadow-xs">
        <Bell className="mx-auto w-6 h-6 text-muted-foreground/60 mb-2" />
        No specific briefings or announcements posted for Week {weekNumber} yet.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-tight font-sans">
              Week {weekNumber} Briefings & Notes
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] font-medium text-muted-foreground font-sans">
            Important announcements, live Zoom links, and weekly guidance
          </p>
        </div>
        <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded-sm bg-muted/60 border border-border text-foreground">
          {announcements.length} {announcements.length === 1 ? "NOTE" : "NOTES"}
        </span>
      </div>

      {/* Prominent Quick-Join Zoom Banner if available */}
      {primaryZoom?.zoomUrl && (
        <div className="p-3 sm:p-4 bg-primary/10 border-b border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                Synchronous Live Session Scheduled
              </h4>
              <p className="text-xs text-muted-foreground">
                Week {weekNumber} live discussion session
              </p>
            </div>
          </div>
          <a
            href={primaryZoom.zoomUrl}
            target="_blank"
            rel="noreferrer"
            className="h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 self-stretch sm:self-auto"
          >
            <Video className="w-4 h-4" />
            <span>Join Live Zoom</span>
          </a>
        </div>
      )}

      {/* Announcements List */}
      <div className="divide-y divide-border/60">
        {announcements.map((ann) => {
          const isExpanded = expandedId === ann.id;
          return (
            <div key={ann.id} className="p-4 sm:p-5 transition-colors hover:bg-muted/10">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug tracking-tight font-sans">
                    {ann.title}
                  </h3>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-sans">
                      <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                      {ann.authorName}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-xs tabular-nums">
                      {new Date(ann.postedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                    className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted/30 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
                    aria-label={isExpanded ? "Collapse announcement" : "Expand announcement"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16, ease: [0.25, 1, 0.5, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3.5 pt-3.5 border-t border-border/60">
                      <div
                        className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans [&_a]:text-primary [&_a]:underline space-y-2.5"
                        dangerouslySetInnerHTML={{ __html: ann.message }}
                      />
                      <div className="mt-3 flex justify-end">
                        <a
                          href={ann.canvasUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-3 rounded-md border border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <span>Open in Canvas</span>
                          <ExternalLink className="w-3 h-3" />
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
