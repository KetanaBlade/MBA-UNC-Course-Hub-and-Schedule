"use client";

import React from "react";
import {
  Calendar,
  CheckCircle2,
  Key,
  RefreshCw,
  Share2,
  Sparkles,
} from "lucide-react";
import { StudentAuthTokens } from "@/lib/canvas/types";
import { ThemeToggle } from "./ThemeToggle";

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
    <header className="sticky top-0 z-40 w-full border-b border-[#E4E1D8]/80 dark:border-border/80 bg-[#13294B] text-white shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand & Program Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#4B9CD3] font-bold text-[#13294B] shadow-inner text-base tracking-tighter">
            UNC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-sm sm:text-base font-sans">
                Kenan-Flagler Online MBA
              </span>
              {isDemoMode && (
                <span className="micro-tag bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  <Sparkles className="h-2.5 w-2.5" />
                  DEMO
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block tracking-normal opacity-90">
              Centralized Course Hub & Master Schedule
            </p>
          </div>
        </div>

        {/* Canvas Instance Micro-Tags (Desktop) */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 border border-white/10">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasDigitalCampus || isDemoMode ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-200">
              DIGITALCAMPUS
            </span>
            {(hasDigitalCampus || isDemoMode) && (
              <CheckCircle2 className="h-3 w-3 text-emerald-400 ml-0.5" />
            )}
          </div>

          <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 border border-white/10">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasKenanFlagler || isDemoMode ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-200">
              KENAN-FLAGLER
            </span>
            {(hasKenanFlagler || isDemoMode) && (
              <CheckCircle2 className="h-3 w-3 text-emerald-400 ml-0.5" />
            )}
          </div>
        </div>

        {/* Action Controls & Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Refresh / Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            aria-label="Synchronize Canvas data"
            className="btn-tactile flex min-h-[38px] items-center justify-center rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] disabled:opacity-50"
            title="Refresh Canvas Data"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 sm:mr-1.5 ${isSyncing ? "animate-spin text-[#4B9CD3]" : ""}`}
            />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Export Calendar (.ics) */}
          <button
            onClick={onExportCalendar}
            aria-label="Export Master Calendar to iCal"
            className="btn-tactile flex min-h-[38px] items-center justify-center rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3]"
            title="Export Calendar (.ics)"
          >
            <Calendar className="h-3.5 w-3.5 sm:mr-1.5 text-[#4B9CD3]" />
            <span className="hidden sm:inline">Export .ics</span>
          </button>

          {/* Cohort Share */}
          <button
            onClick={onOpenCohortShare}
            aria-label="Cohort sharing tools"
            className="btn-tactile flex min-h-[38px] items-center justify-center rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3]"
            title="Share Schedule with Cohort"
          >
            <Share2 className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Settings / Tokens */}
          <button
            onClick={onOpenSettings}
            aria-label="Open Token Settings"
            className="btn-tactile flex min-h-[38px] items-center justify-center rounded-md bg-[#4B9CD3] hover:bg-[#5aa8dd] px-3 py-1.5 text-xs font-bold text-[#13294B] shadow-2xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Key className="h-3.5 w-3.5 mr-1.5" />
            <span>Tokens</span>
          </button>
        </div>
      </div>
    </header>
  );
}
