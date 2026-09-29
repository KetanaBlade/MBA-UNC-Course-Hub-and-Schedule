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
  lastSyncedAt?: Date | null;
}

export function Navbar({
  tokens,
  isDemoMode,
  onOpenSettings,
  onOpenCohortShare,
  onExportCalendar,
  onSync,
  isSyncing,
  lastSyncedAt,
}: NavbarProps) {
  const hasDigitalCampus = Boolean(tokens.digitalCampusToken);
  const hasKenanFlagler = Boolean(tokens.kenanFlaglerToken);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-md text-foreground transition-colors shadow-2xs">
      <div className="mx-auto flex max-w-[1650px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Program Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground shadow-xs text-sm font-sans tracking-tight">
            UNC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-foreground text-sm sm:text-base font-sans">
                Kenan-Flagler Online MBA
              </span>
              {isDemoMode && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-primary">
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

        {/* Canvas Instance Micro-Data Tags */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase px-2.5 py-1 rounded-sm bg-muted/60 border border-border text-foreground">
            <span
              className={`h-2 w-2 rounded-full ${
                hasDigitalCampus || isDemoMode ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>DIGITALCAMPUS</span>
            {(hasDigitalCampus || isDemoMode) && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ml-0.5" />
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase px-2.5 py-1 rounded-sm bg-muted/60 border border-border text-foreground">
            <span
              className={`h-2 w-2 rounded-full ${
                hasKenanFlagler || isDemoMode ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>KENAN-FLAGLER</span>
            {(hasKenanFlagler || isDemoMode) && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ml-0.5" />
            )}
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          {/* Refresh / Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            aria-label="Synchronize Canvas data"
            className="h-9 px-3 sm:px-3.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs sm:text-sm font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
            title={
              lastSyncedAt
                ? `Last synced at ${lastSyncedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} • Auto-syncs every 5m`
                : "Refresh Canvas Data (Auto-syncs every 5m)"
            }
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-muted-foreground ${isSyncing ? "animate-spin text-primary" : ""}`}
            />
            <span className="hidden sm:inline">Sync</span>
            {lastSyncedAt && !isSyncing && (
              <span className="hidden xl:inline text-[10px] text-muted-foreground font-normal ml-0.5 tabular-nums">
                {lastSyncedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </button>

          {/* Export Calendar (.ics) */}
          <button
            onClick={onExportCalendar}
            aria-label="Export Master Calendar to iCal"
            className="h-9 px-3 sm:px-3.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs sm:text-sm font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Export Calendar (.ics)"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Export .ics</span>
          </button>

          {/* Cohort Share */}
          <button
            onClick={onOpenCohortShare}
            aria-label="Cohort sharing tools"
            className="h-9 px-3 sm:px-3.5 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs sm:text-sm font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Share Schedule with Cohort"
          >
            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Primary Tokens Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Open Token Settings"
            className="h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Tokens</span>
          </button>
        </div>
      </div>
    </header>
  );
}
