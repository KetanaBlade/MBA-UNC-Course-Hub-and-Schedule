"use client";

import React from "react";
import {
  BookOpen,
  Check,
  Download,
  ExternalLink,
  FolderTree,
} from "lucide-react";
import confetti from "canvas-confetti";
import { NormalizedReading, ReadingCategory } from "@/lib/canvas/types";

interface ReadingsSectionProps {
  readings: NormalizedReading[];
  weekNumber: number;
  onToggleComplete: (id: string) => void;
}

export function ReadingsSection({
  readings,
  weekNumber,
  onToggleComplete,
}: ReadingsSectionProps) {
  const completedCount = readings.filter((r) => r.isCompleted).length;
  const progressPercent =
    readings.length > 0 ? Math.round((completedCount / readings.length) * 100) : 0;

  const handleCheckboxClick = (reading: NormalizedReading) => {
    onToggleComplete(reading.id);
    if (!reading.isCompleted && completedCount + 1 === readings.length) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#4B9CD3", "#13294B", "#059669"],
        });
      } catch {
        // Confetti optional
      }
    }
  };

  const getCategoryChip = (category: ReadingCategory) => {
    switch (category) {
      case "case":
        return (
          <span className="micro-tag bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            CASE
          </span>
        );
      case "slides":
        return (
          <span className="micro-tag bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            SLIDES
          </span>
        );
      case "spreadsheet":
        return (
          <span className="micro-tag bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            MODEL
          </span>
        );
      case "video":
        return (
          <span className="micro-tag bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            VIDEO
          </span>
        );
      default:
        return (
          <span className="micro-tag bg-muted text-muted-foreground border border-border/80">
            READING
          </span>
        );
    }
  };

  if (readings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
        <BookOpen className="mx-auto h-5 w-5 text-muted-foreground/60 mb-1.5" />
        No pre-readings or files identified for Week {weekNumber}.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
      {/* Outer Card Header */}
      <div className="border-b border-border/80 bg-muted/20 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-foreground">
              Week {weekNumber} Readings & Course Materials
            </h3>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            {completedCount}/{readings.length} COMPLETED ({progressPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-[#059669] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* De-Boxified List Rows */}
      <div className="divide-y divide-border/60">
        {readings.map((reading) => {
          return (
            <div
              key={reading.id}
              className={`flex items-start gap-3 p-3.5 sm:p-4 transition hover:bg-muted/10 ${
                reading.isCompleted ? "opacity-60 bg-muted/5" : ""
              }`}
            >
              {/* Tactile Checkbox */}
              <button
                type="button"
                onClick={() => handleCheckboxClick(reading)}
                aria-label={`Mark ${reading.title} as ${reading.isCompleted ? "incomplete" : "complete"}`}
                className={`btn-tactile mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[3px] border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] ${
                  reading.isCompleted
                    ? "border-[#059669] bg-[#059669] text-white"
                    : "border-border bg-white dark:bg-card hover:border-foreground/40"
                }`}
              >
                {reading.isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </button>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold leading-snug ${
                      reading.isCompleted
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {reading.title}
                  </span>
                  {getCategoryChip(reading.category)}

                  {/* Rescued from files badge */}
                  {reading.source === "files_tab" && (
                    <span className="micro-tag bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                      <FolderTree className="h-2.5 w-2.5" />
                      FILES TAB
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                  {reading.folderPath && (
                    <span className="font-mono text-[10px] text-muted-foreground/80">
                      {reading.folderPath}
                    </span>
                  )}
                  {reading.fileSizeFormatted && (
                    <span className="font-mono text-[10px] tabular-nums">
                      • {reading.fileSizeFormatted}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons (Tier 4 Controls) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {reading.fileUrl ? (
                  <a
                    href={reading.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="btn-tactile flex min-h-[34px] items-center justify-center rounded-md border border-border/80 bg-white/80 dark:bg-card px-2.5 py-1 text-xs font-bold text-foreground shadow-2xs hover:bg-white transition"
                    title="Download file"
                  >
                    <Download className="h-3 w-3 sm:mr-1 text-muted-foreground" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                ) : (
                  <a
                    href={reading.canvasUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-tactile flex min-h-[34px] items-center justify-center rounded-md border border-border/80 bg-white/80 dark:bg-card px-2.5 py-1 text-xs font-bold text-foreground shadow-2xs hover:bg-white transition"
                    title="View on Canvas"
                  >
                    <ExternalLink className="h-3 w-3 sm:mr-1 text-muted-foreground" />
                    <span className="hidden sm:inline">Open</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
