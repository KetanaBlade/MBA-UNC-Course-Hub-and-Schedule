"use client";

import React from "react";
import {
  Calendar,
  CheckCircle2,
  Download,
  Key,
  RefreshCw,
  Share2,
  Sparkles,
} from "lucide-react";
import { StudentAuthTokens } from "@/lib/canvas/types";

interface NavbarProps {
  tokens: StudentAuthTokens;
  isDemoMode: boolean;
  onOpenSettings: () => void;
  onOpenCohortShare: () => void;
  onExportCalendar: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export function Navbar({
  tokens,
  isDemoMode,
  onOpenSettings,
  onOpenCohortShare,
  onExportCalendar,
  onSync,
  isSyncing,
}: NavbarProps) {
  const hasDigitalCampus = Boolean(tokens.digitalCampusToken);
  const hasKenanFlagler = Boolean(tokens.kenanFlaglerToken);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-[#13294B] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Program Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4B9CD3] font-bold text-[#13294B] shadow-inner text-lg">
            UNC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-white text-base sm:text-lg">
                Kenan-Flagler Online MBA
              </span>
              {isDemoMode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-medium text-amber-200 border border-amber-400/40">
                  <Sparkles className="h-3 w-3" />
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 hidden sm:block">
              Centralized Course Resources, Weekly Readings & Calendar
            </p>
          </div>
        </div>

        {/* Canvas Instance Status Indicators (Desktop) */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 border border-white/10">
            <span
              className={`h-2 w-2 rounded-full ${
                hasDigitalCampus || isDemoMode ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span className="text-slate-200">digitalcampus</span>
            {(hasDigitalCampus || isDemoMode) && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 ml-0.5" />
            )}
          </div>

          <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 border border-white/10">
            <span
              className={`h-2 w-2 rounded-full ${
                hasKenanFlagler || isDemoMode ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span className="text-slate-200">kenan-flagler</span>
            {(hasKenanFlagler || isDemoMode) && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 ml-0.5" />
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Refresh / Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            aria-label="Synchronize Canvas data"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] active:scale-95 disabled:opacity-50"
            title="Refresh Canvas Data"
          >
            <RefreshCw
              className={`h-4 w-4 sm:mr-1.5 ${isSyncing ? "animate-spin text-[#4B9CD3]" : ""}`}
            />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Export Calendar (.ics) */}
          <button
            onClick={onExportCalendar}
            aria-label="Export Master Calendar to iCal"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] active:scale-95"
            title="Export Calendar (.ics) for Google/Outlook"
          >
            <Calendar className="h-4 w-4 sm:mr-1.5 text-[#4B9CD3]" />
            <span className="hidden sm:inline">Export .ics</span>
          </button>

          {/* Cohort Share */}
          <button
            onClick={onOpenCohortShare}
            aria-label="Cohort sharing tools"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] active:scale-95"
            title="Share Schedule with Cohort"
          >
            <Share2 className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Settings / Tokens */}
          <button
            onClick={onOpenSettings}
            aria-label="Open Token Settings"
            className="flex min-h-[44px] items-center justify-center rounded-lg bg-[#4B9CD3] px-3.5 py-2 text-sm font-semibold text-[#13294B] shadow-sm transition hover:bg-[#6baee0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
          >
            <Key className="h-4 w-4 mr-1.5" />
            <span>Tokens</span>
          </button>
        </div>
      </div>
    </header>
  );
}
