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
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/90 backdrop-blur-md text-foreground transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Program Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground shadow-xs text-sm font-sans tracking-tight">
            UNC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-foreground text-sm sm:text-base font-sans">
                Kenan-Flagler Online MBA
              </span>
              {isDemoMode && (
                <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="h-2.5 w-2.5 inline mr-1" />
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Centralized Course Resources & Master Schedule
            </p>
          </div>
        </div>

        {/* Canvas Instance Micro-Data Tags (Recipe 5.6) */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase px-2 py-1 rounded-sm bg-muted/60 border border-border/80 text-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasDigitalCampus || isDemoMode ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>DIGITALCAMPUS</span>
            {(hasDigitalCampus || isDemoMode) && (
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase px-2 py-1 rounded-sm bg-muted/60 border border-border/80 text-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasKenanFlagler || isDemoMode ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>KENAN-FLAGLER</span>
            {(hasKenanFlagler || isDemoMode) && (
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />
            )}
          </div>
        </div>

        {/* Action Triggers (Recipe 5.5) */}
        <div className="flex items-center gap-2">
          {/* Refresh / Sync Button (Secondary Trigger) */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            aria-label="Synchronize Canvas data"
            className="h-9 px-3 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh Canvas Data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-muted-foreground ${isSyncing ? "animate-spin text-primary" : ""}`}
            />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Export Calendar (.ics) (Secondary Trigger) */}
          <button
            onClick={onExportCalendar}
            aria-label="Export Master Calendar to iCal"
            className="h-9 px-3 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            title="Export Calendar (.ics)"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Export .ics</span>
          </button>

          {/* Cohort Share (Secondary Trigger) */}
          <button
            onClick={onOpenCohortShare}
            aria-label="Cohort sharing tools"
            className="h-9 px-3 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            title="Share Schedule with Cohort"
          >
            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Primary Tokens Button (Recipe 5.5 Primary Action) */}
          <button
            onClick={onOpenSettings}
            aria-label="Open Token Settings"
            className="h-9 px-3.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Tokens</span>
          </button>
        </div>
      </div>
    </header>
  );
}
