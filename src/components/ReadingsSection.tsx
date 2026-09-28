"use client";

import React from "react";
import {
  BookOpen,
  Check,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Presentation,
  Video,
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
    // If completing the last reading, fire confetti!
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

  const getCategoryIcon = (category: ReadingCategory) => {
    switch (category) {
      case "case":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "slides":
        return <Presentation className="h-4 w-4 text-amber-600" />;
      case "spreadsheet":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
      case "video":
        return <Video className="h-4 w-4 text-rose-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-sky-600" />;
    }
  };

  const getCategoryBadge = (category: ReadingCategory) => {
    switch (category) {
      case "case":
        return (
          <span className="rounded-sm bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">
            HBR / Case
          </span>
        );
      case "slides":
        return (
          <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
            Slide Deck
          </span>
        );
      case "spreadsheet":
        return (
          <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
            Model / Excel
          </span>
        );
      case "video":
        return (
          <span className="rounded-sm bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
            Video / Recording
          </span>
        );
      default:
        return (
          <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
            Reading
          </span>
        );
    }
  };

  if (readings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">
        <BookOpen className="mx-auto h-6 w-6 text-slate-400 mb-1.5 opacity-60" />
        No pre-readings or files identified for Week {weekNumber}.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header with Reading Progress */}
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Week {weekNumber} Readings & Course Materials
            </h3>
          </div>
          <span className="text-xs font-semibold tabular-nums text-slate-700">
            {completedCount} of {readings.length} completed ({progressPercent}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-[#059669] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Readings List */}
      <div className="divide-y divide-slate-100">
        {readings.map((reading) => {
          return (
            <div
              key={reading.id}
              className={`flex items-start gap-3 p-4 transition sm:px-5 hover:bg-slate-50/60 ${
                reading.isCompleted ? "bg-slate-50/40" : ""
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => handleCheckboxClick(reading)}
                aria-label={`Mark ${reading.title} as ${reading.isCompleted ? "incomplete" : "complete"}`}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] ${
                  reading.isCompleted
                    ? "border-[#059669] bg-[#059669] text-white"
                    : "border-slate-300 bg-white hover:border-slate-400"
                }`}
              >
                {reading.isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </button>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-sm font-medium leading-snug ${
                      reading.isCompleted
                        ? "text-slate-500 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {reading.title}
                  </span>
                  {getCategoryBadge(reading.category)}

                  {/* Rescued from files badge */}
                  {reading.source === "files_tab" && (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200/50">
                      <FolderTree className="h-2.5 w-2.5" />
                      Files Tab Folder
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {reading.folderPath && (
                    <span className="font-mono text-[11px] text-slate-400">
                      {reading.folderPath}
                    </span>
                  )}
                  {reading.fileSizeFormatted && (
                    <span>{reading.fileSizeFormatted}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {reading.fileUrl ? (
                  <a
                    href={reading.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                    title="Download file"
                  >
                    <Download className="h-3.5 w-3.5 sm:mr-1 text-slate-500" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                ) : (
                  <a
                    href={reading.canvasUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                    title="View on Canvas"
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:mr-1 text-slate-500" />
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
