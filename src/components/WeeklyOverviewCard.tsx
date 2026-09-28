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
      <div className="border border-border/70 rounded-lg bg-card p-6 text-center text-xs text-muted-foreground shadow-xs">
        <Bell className="mx-auto w-5 h-5 text-muted-foreground/60 mb-1.5" />
        No specific announcements posted for Week {weekNumber} yet.
      </div>
    );
  }

  return (
    <div className="border border-border/70 rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
      {/* Card Header (Recipe 5.2) */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/40 bg-card">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground tracking-tight font-sans">
              Week {weekNumber} Briefings & Professor Notes
            </h2>
          </div>
          <p className="text-sm font-medium text-muted-foreground font-sans">
            Important announcements, live Zoom links, and weekly guidance
          </p>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-muted/60 border border-border/80 text-muted-foreground">
          {announcements.length} {announcements.length === 1 ? "NOTE" : "NOTES"}
        </span>
      </div>

      {/* De-Boxified Rows */}
      <div className="divide-y divide-border/40">
        {announcements.map((ann) => {
          const isExpanded = expandedId === ann.id;
          return (
            <div key={ann.id} className="p-4 sm:p-5 transition hover:bg-muted/15">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground leading-snug font-sans">
                    {ann.title}
                  </h3>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-sans">
                      <User className="w-3 h-3 text-muted-foreground/70" />
                      {ann.authorName}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] tabular-nums">
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
                      className="h-8 px-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Zoom</span>
                    </a>
                  )}

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                    className="h-8 w-8 rounded-md border border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
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

              {/* Framer Motion Collapsible Accordion */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16, ease: [0.25, 1, 0.5, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <div
                        className="text-xs text-foreground/90 leading-relaxed font-sans [&_a]:text-primary [&_a]:underline space-y-2"
                        dangerouslySetInnerHTML={{ __html: ann.message }}
                      />
                      <div className="mt-3 flex justify-end">
                        <a
                          href={ann.canvasUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-2.5 rounded-md border border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-all flex items-center gap-1"
                        >
                          <span>View in Canvas</span>
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
