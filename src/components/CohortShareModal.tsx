"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Download,
  Share2,
  Sparkles,
  Upload,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] touch-target"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13294B] text-[#4B9CD3]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 id="share-title" className="text-xl font-bold tracking-tight text-slate-900">
              Share with Your Cohort
            </h2>
            <p className="text-xs text-slate-500">
              Zero-install setup for UNC Kenan-Flagler classmates
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              How classmates use this app:
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 mt-2">
              <li>
                Send them your hosted web link (e.g. your Vercel deployment URL).
              </li>
              <li>
                They open the link on their phone, iPad, or laptop.
              </li>
              <li>
                They click <strong>Tokens</strong> and paste their own Canvas access keys (which takes 60 seconds).
              </li>
              <li>
                Their schedule and files load immediately—with zero setup friction and complete privacy!
              </li>
            </ol>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Share Web Link
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={typeof window !== "undefined" ? window.location.origin : ""}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 select-all"
              />
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#13294B] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1a3866] transition shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-slate-800">Export Cohort Course Config</h5>
                <p className="text-[11px] text-slate-500">
                  Save active course structure backup as JSON
                </p>
              </div>
              <button
                onClick={handleDownloadConfig}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
