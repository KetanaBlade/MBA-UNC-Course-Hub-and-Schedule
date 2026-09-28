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
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#D44E18", "#EF6453", "#059669"],
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
          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            CASE
          </span>
        );
      case "slides":
        return (
          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            SLIDES
          </span>
        );
      case "spreadsheet":
        return (
          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            MODEL
          </span>
        );
      case "video":
        return (
          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            VIDEO
          </span>
        );
      default:
        return (
          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-muted/60 border border-border/80 text-muted-foreground">
            READING
          </span>
        );
    }
  };

  if (readings.length === 0) {
    return (
      <div className="border border-border/70 rounded-lg bg-card p-6 text-center text-xs text-muted-foreground shadow-xs">
        <BookOpen className="mx-auto w-5 h-5 text-muted-foreground/60 mb-1.5" />
        No pre-readings or files identified for Week {weekNumber}.
      </div>
    );
  }

  return (
    <div className="border border-border/70 rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
      {/* Card Header (Recipe 5.2) */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/40 bg-card">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground tracking-tight font-sans">
              Week {weekNumber} Readings & Course Materials
            </h2>
          </div>
          <p className="text-sm font-medium text-muted-foreground font-sans">
            Pre-readings, HBR cases, and slide decks organized for this week
          </p>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm bg-muted/60 border border-border/80 text-foreground">
          {completedCount}/{readings.length} COMPLETED ({progressPercent}%)
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-1 w-full bg-muted/40">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* De-Boxified List Rows */}
      <div className="divide-y divide-border/40">
        {readings.map((reading) => {
          return (
            <div
              key={reading.id}
              className={`p-3.5 sm:p-4 flex items-start gap-3 transition hover:bg-muted/15 ${
                reading.isCompleted ? "opacity-60 bg-muted/5" : ""
              }`}
            >
              {/* Tactile Checkbox */}
              <button
                type="button"
                onClick={() => handleCheckboxClick(reading)}
                aria-label={`Mark ${reading.title} as ${reading.isCompleted ? "incomplete" : "complete"}`}
                className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm border transition-all cursor-pointer ${
                  reading.isCompleted
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border bg-card hover:border-primary"
                }`}
              >
                {reading.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-sm font-medium leading-snug font-sans ${
                      reading.isCompleted
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {reading.title}
                  </span>
                  {getCategoryChip(reading.category)}

                  {/* Rescued from files badge (Recipe 5.6) */}
                  {reading.source === "files_tab" && (
                    <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 flex items-center gap-1">
                      <FolderTree className="w-2.5 h-2.5" />
                      FILES TAB
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                  {reading.folderPath && (
                    <span className="font-mono text-[10px] text-muted-foreground">
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

              {/* Action Button (Recipe 5.5 Outline / Secondary Button) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {reading.fileUrl ? (
                  <a
                    href={reading.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                ) : (
                  <a
                    href={reading.canvasUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                    title="View on Canvas"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
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
