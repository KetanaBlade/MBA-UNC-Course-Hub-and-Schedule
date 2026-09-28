"use client";

import React, { useState } from "react";
import { Check, Download, ExternalLink, FileSpreadsheet, FileText, Search } from "lucide-react";
import { NormalizedReading } from "@/lib/canvas/types";
import { getCourseColor, getCleanCourseName } from "@/lib/courseColors";

interface CourseFilesCardProps {
  files: NormalizedReading[];
  weekNumber: number;
  onToggleComplete: (id: string) => void;
}

export function CourseFilesCard({ files, weekNumber, onToggleComplete }: CourseFilesCardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFiles = files.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.title.toLowerCase().includes(term) ||
      (f.folderPath && f.folderPath.toLowerCase().includes(term)) ||
      (f.courseCode && f.courseCode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden flex flex-col h-full transition-all">
      {/* Sticky Header: Clean, count integrated into headline, zero zoom wrapping */}
      <div className="sticky top-0 z-20 bg-card border-b border-border p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            Week {weekNumber} Course Files{" "}
            <span className="text-primary font-mono text-base font-bold">
              ({files.length})
            </span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
            Spreadsheets, slide decks, and data rescued from Canvas Files
          </p>
        </div>

        {/* Search Bar */}
        <div className="pt-0.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files by name or folder..."
              className="w-full h-8 pl-9 pr-3 text-xs sm:text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Files List (max-h-[760px]) */}
      <div className="overflow-y-auto max-h-[760px] divide-y divide-border/60">
        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground">
            No course files found for Week {weekNumber}.
          </div>
        ) : (
          filteredFiles.map((file) => {
            const courseColor = file.courseCode ? getCourseColor(file.courseCode) : null;
            return (
              <div
                key={file.id}
                className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors hover:bg-muted/10 ${
                  file.isCompleted ? "opacity-60 bg-muted/5" : ""
                }`}
              >
                {/* Tactile Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleComplete(file.id)}
                  aria-label={`Mark ${file.title} as ${file.isCompleted ? "incomplete" : "complete"}`}
                  className={`mt-0.5 flex h-5 w-5 min-w-[20px] min-h-[20px] shrink-0 items-center justify-center rounded-sm border-2 transition-all cursor-pointer ${
                    file.isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                      : "border-border bg-card hover:border-primary"
                  }`}
                >
                  {file.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {file.courseCode && courseColor && (
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                      >
                        {getCleanCourseName(file.courseCode, file.courseName)}
                      </span>
                    )}
                    <h4
                      className={`text-sm sm:text-base font-semibold leading-snug break-words ${
                        file.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {file.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-muted-foreground">
                    {file.category === "spreadsheet" ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        EXCEL / MODEL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-muted-foreground">
                        <FileText className="w-3.5 h-3.5" />
                        DOCUMENT
                      </span>
                    )}
                    {file.folderPath && (
                      <span className="font-mono text-xs text-muted-foreground/80">
                        • {file.folderPath}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stacked View & Download Buttons */}
                <div className="shrink-0 flex flex-col gap-1 items-end self-center">
                  <a
                    href={file.canvasUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                    title="View on Canvas"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>

                  {file.fileUrl && (
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="h-6 px-2.5 rounded border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      title="Download file"
                    >
                      <span>Download</span>
                      <Download className="w-3 h-3 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
