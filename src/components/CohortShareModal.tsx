"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Download,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AppStorage } from "@/lib/storage";

interface CohortShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CohortShareModal({ isOpen, onClose }: CohortShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cohortConfig = AppStorage.exportCohortConfig();

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([cohortConfig], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UNC_MBA_Cohort_Schedule_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-card border border-border/80 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header (Recipe 5.7) */}
        <div className="p-5 border-b border-border/40 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-primary" />
            <h3 id="share-title" className="text-lg font-semibold text-foreground tracking-tight font-sans">
              Share with Your Cohort
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground rounded-sm p-1 cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Recipe 5.7) */}
        <div className="p-5 space-y-4 text-sm font-medium text-foreground">
          <div className="bg-muted/20 border border-border/70 rounded-md p-3.5 space-y-1.5 text-xs text-muted-foreground">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>How classmates use this app:</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-xs">
              <li>
                Send them your hosted web link (e.g., your Vercel deployment URL).
              </li>
              <li>
                They open the link on their phone, iPad, or laptop.
              </li>
              <li>
                They click <strong className="text-foreground">Tokens</strong> and paste their own Canvas access keys (60 seconds).
              </li>
              <li>
                Their schedule and materials load immediately with zero server-side storage!
              </li>
            </ol>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Share Web Link</span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase">URL</span>
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={typeof window !== "undefined" ? window.location.origin : ""}
                className="w-full h-10 px-3 rounded-md bg-card border border-border text-xs font-mono text-foreground select-all outline-none"
              />
              <button
                onClick={handleCopy}
                className="h-10 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-foreground text-xs font-sans">Export Cohort Course Config</h5>
                <p className="text-[11px] text-muted-foreground">
                  Backup current course mapping JSON
                </p>
              </div>
              <button
                onClick={handleDownloadConfig}
                className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer (Recipe 5.7) */}
        <div className="p-4 bg-muted/20 border-t border-border/40 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
