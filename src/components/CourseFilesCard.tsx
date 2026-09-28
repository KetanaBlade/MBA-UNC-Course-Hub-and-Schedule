"use client";

import React, { useState } from "react";
import { Download, ExternalLink, FileSpreadsheet, FileText, FolderTree, Search } from "lucide-react";
import { NormalizedReading } from "@/lib/canvas/types";
import { getCourseColor } from "@/lib/courseColors";

interface CourseFilesCardProps {
  files: NormalizedReading[];
  weekNumber: number;
}

export function CourseFilesCard({ files, weekNumber }: CourseFilesCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredFiles = files.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.title.toLowerCase().includes(term) ||
      (f.folderPath && f.folderPath.toLowerCase().includes(term)) ||
      (f.courseCode && f.courseCode.toLowerCase().includes(term))
    );
  });

  const displayList = showAll ? filteredFiles : filteredFiles.slice(0, 5);

  return (
    <div className="border border-border rounded-lg bg-card text-card-foreground shadow-xs overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-tight font-sans">
              Week {weekNumber} Course Files & Models
            </h2>
          </div>
          <p className="text-xs sm:text-[13px] font-medium text-muted-foreground font-sans">
            Files rescued from Canvas &apos;Files&apos; folders (spreadsheets, slide decks, and data)
          </p>
        </div>
        <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded-sm bg-muted/60 border border-border text-foreground self-start sm:self-auto">
          {files.length} {files.length === 1 ? "FILE" : "FILES"}
        </span>
      </div>

      {/* Optional Search if more than 4 files */}
      {files.length > 4 && (
        <div className="p-3 border-b border-border bg-muted/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files by name or folder..."
              className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="p-6 text-center text-xs sm:text-sm text-muted-foreground">
          No course files identified for Week {weekNumber}.
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {displayList.map((file) => {
            const courseColor = file.courseCode ? getCourseColor(file.courseCode) : null;
            return (
              <div
                key={file.id}
                className="p-3.5 sm:p-4 flex items-start justify-between gap-3 transition-colors hover:bg-muted/10"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {file.courseCode && courseColor && (
                      <span
                        className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-sm border ${courseColor.badge}`}
                      >
                        {file.courseCode}
                      </span>
                    )}
                    <h4 className="text-sm sm:text-base font-semibold text-foreground leading-snug break-words">
                      {file.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-sans">
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
                    {file.fileSizeFormatted && (
                      <span className="font-mono text-xs text-muted-foreground/80">
                        • {file.fileSizeFormatted}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 self-center">
                  {file.fileUrl ? (
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="h-8 px-3 rounded-md border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Download</span>
                    </a>
                  ) : (
                    <a
                      href={file.canvasUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-3 rounded-md border border-border bg-card hover:bg-muted/30 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>View</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show more button if > 5 */}
      {filteredFiles.length > 5 && !showAll && (
        <div className="p-3 border-t border-border bg-muted/5 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Show all {filteredFiles.length} files
          </button>
        </div>
      )}
    </div>
  );
}
