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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-card p-6 sm:p-7 shadow-2xl border border-border">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="btn-tactile absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground touch-target"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
            <Users className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 id="share-title" className="text-lg font-bold tracking-tight text-foreground font-sans">
              Share with Your Cohort
            </h2>
            <p className="text-xs text-muted-foreground">
              Zero-install handoff for UNC Kenan-Flagler classmates
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3.5 text-xs text-muted-foreground leading-relaxed">
          <div className="inner-strip p-3.5 space-y-1.5">
            <h4 className="font-bold text-foreground flex items-center gap-1.5 font-sans">
              <Sparkles className="h-3 w-3 text-amber-500" />
              How classmates use this app:
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
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/80 font-sans">
              Share Web Link
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={typeof window !== "undefined" ? window.location.origin : ""}
                className="w-full rounded-md border border-border bg-muted/20 px-3 py-1.5 text-xs font-mono text-foreground select-all"
              />
              <button
                onClick={handleCopy}
                className="btn-tactile inline-flex items-center gap-1.5 rounded-md bg-[#13294B] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1a3866] transition shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-t border-border/80 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-foreground font-sans">Export Cohort Course Config</h5>
                <p className="text-[11px] text-muted-foreground">
                  Save active course structure backup as JSON
                </p>
              </div>
              <button
                onClick={handleDownloadConfig}
                className="btn-tactile inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-white/80 dark:bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs hover:bg-white"
              >
                <Download className="h-3 w-3 text-muted-foreground" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
