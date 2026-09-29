"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { StudentAuthTokens } from "@/lib/canvas/types";
import { AppStorage } from "@/lib/storage";

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTokens: (tokens: StudentAuthTokens) => Promise<boolean>;
  onEnableDemoMode: () => void;
  initialTokens: StudentAuthTokens;
  onRestoreBackup?: () => void;
}

export function SetupWizard({
  isOpen,
  onClose,
  onSaveTokens,
  onEnableDemoMode,
  initialTokens,
  onRestoreBackup,
}: SetupWizardProps) {
  const [digitalToken, setDigitalToken] = useState(initialTokens.digitalCampusToken);
  const [kfToken, setKfToken] = useState(initialTokens.kenanFlaglerToken);
  const [showDigitalToken, setShowDigitalToken] = useState(false);
  const [showKfToken, setShowKfToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [backupMessage, setBackupMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Close dialog on Escape key and load completed count
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      setCompletedCount(AppStorage.getCompletedItems().size);
      setBackupMessage(null);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleExportBackup = () => {
    const json = AppStorage.exportBackupData();
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `UNC_MBA_Hub_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMessage({ text: "Backup file downloaded successfully!", isError: false });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") return;
      const result = AppStorage.importBackupData(content);
      if (result.success) {
        setCompletedCount(AppStorage.getCompletedItems().size);
        setBackupMessage({
          text: `Restored ${result.count} completed items & preferences!`,
          isError: false,
        });
        if (onRestoreBackup) onRestoreBackup();
      } else {
        setBackupMessage({
          text: result.error || "Failed to restore backup",
          isError: true,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);
    setIsVerifying(true);

    try {
      const success = await onSaveTokens({
        digitalCampusToken: digitalToken.trim(),
        kenanFlaglerToken: kfToken.trim(),
      });

      if (success) {
        setVerificationSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setVerificationError(
          "One or both tokens could not be verified. Please verify you copied the full token correctly."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification error occurred";
      setVerificationError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-card border border-border/80 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col my-auto">
        {/* Dialog Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 id="wizard-title" className="text-base sm:text-lg font-semibold text-foreground tracking-tight font-sans">
                Canvas Integration Setup
              </h3>
              <p className="text-xs text-muted-foreground">
                Connect your Canvas access tokens for real-time synchronization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup dialog"
            className="text-muted-foreground hover:text-foreground rounded-sm p-1.5 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Body (Scrollable if needed) */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 space-y-4 text-sm font-medium text-foreground">
            {/* Step-by-Step Generation Guide */}
            <div className="bg-muted/20 border border-border/80 rounded-lg p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  How to generate your Canvas Access Token:
                </span>
                <span className="text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                  5-Step Guide
                </span>
              </div>

              {/* Visual Breadcrumb Pipeline */}
              <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold py-1 px-2 rounded-md bg-card/80 border border-border/60">
                <span className="px-1.5 py-0.5 rounded bg-muted/60 text-foreground">
                  1. Log In
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-muted/60 text-foreground">
                  2. Account
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-muted/60 text-foreground">
                  3. Settings
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-muted/60 text-foreground">
                  4. Approved Integrations
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-bold">
                  5. + New Access Token
                </span>
              </div>

              {/* Numbered Detailed Steps */}
              <ol className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[11px] text-primary shrink-0 mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    1
                  </span>
                  <span>
                    <strong className="text-foreground">Log In</strong> to your Canvas portal and click your profile{" "}
                    <strong className="text-foreground">Account</strong> icon in the far-left global navigation sidebar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[11px] text-primary shrink-0 mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    2
                  </span>
                  <span>
                    Select <strong className="text-foreground">Settings</strong> from the slide-out user menu.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[11px] text-primary shrink-0 mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    3
                  </span>
                  <span>
                    Scroll down to the <strong className="text-foreground">Approved Integrations</strong> section.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[11px] text-primary shrink-0 mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    4
                  </span>
                  <span>
                    Click the blue <strong className="text-foreground">+ New Access Token</strong> button. Enter Purpose as{" "}
                    <code className="px-1 py-0.5 rounded bg-card border border-border font-mono text-[11px] text-foreground">
                      UNC MBA Hub
                    </code>
                    , and set <strong className="text-foreground">Expires</strong> to the maximum of{" "}
                    <strong className="text-foreground">90 days</strong> (UNC Canvas policy requires an expiration date and cannot be left blank).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[11px] text-primary shrink-0 mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    5
                  </span>
                  <span>
                    Click <strong className="text-foreground">Generate Token</strong>, copy the generated token string{" "}
                    <em className="text-amber-700 dark:text-amber-400 not-italic">(Canvas only reveals it once!)</em>, and paste it into the field below.
                  </span>
                </li>
              </ol>
            </div>

            {/* Why Two Sites Explainer Note */}
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-md p-3 space-y-1 text-xs text-sky-950 dark:text-sky-200">
              <div className="flex items-center gap-1.5 font-semibold text-sky-900 dark:text-sky-300">
                <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Which tokens do you need?</span>
              </div>
              <p className="leading-relaxed">
                Connect <strong className="text-foreground">Digital Campus</strong> (2U live sync & orientation) and/or{" "}
                <strong className="text-foreground">Kenan-Flagler</strong> (core courses & electives). Providing either or both will sync your schedule!
              </p>
            </div>

            {/* Site 1: DigitalCampus Input */}
            <div className="space-y-1.5 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-foreground">
                <label htmlFor="dc-token-input">
                  1. Digital Campus Token{" "}
                  <span className="font-normal text-muted-foreground">(digitalcampus.instructure.com)</span>
                </label>
                <a
                  href="https://digitalcampus.instructure.com/profile/settings#access_tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Digital Campus Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  id="dc-token-input"
                  type={showDigitalToken ? "text" : "password"}
                  value={digitalToken}
                  onChange={(e) => setDigitalToken(e.target.value)}
                  placeholder="1079~abcdef1234567890..."
                  className="w-full h-10 px-3 pr-10 rounded-md bg-card border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowDigitalToken(!showDigitalToken)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                  aria-label={showDigitalToken ? "Hide Digital Campus token" : "Show Digital Campus token"}
                >
                  {showDigitalToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Site 2: Kenan-Flagler Input */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-foreground">
                <label htmlFor="kf-token-input">
                  2. Kenan-Flagler Token{" "}
                  <span className="font-normal text-muted-foreground">(kenan-flagler.instructure.com)</span>
                </label>
                <a
                  href="https://kenan-flagler.instructure.com/profile/settings#access_tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Kenan-Flagler Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  id="kf-token-input"
                  type={showKfToken ? "text" : "password"}
                  value={kfToken}
                  onChange={(e) => setKfToken(e.target.value)}
                  placeholder="1104~xyz7890123456789..."
                  className="w-full h-10 px-3 pr-10 rounded-md bg-card border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKfToken(!showKfToken)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                  aria-label={showKfToken ? "Hide Kenan-Flagler token" : "Show Kenan-Flagler token"}
                >
                  {showKfToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Zero-Storage Privacy Guarantee */}
            <div className="flex items-start gap-2.5 rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong className="font-semibold text-foreground">FERPA & Zero-Server Privacy: </strong>
                Your tokens are stored strictly inside your browser's private <code className="font-mono text-[11px]">localStorage</code>. They are never sent to a third-party server, database, or analytics platform.
              </p>
            </div>

            {/* Progress Backup & Portability Section */}
            <div className="rounded-md border border-border bg-card p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Database className="w-3.5 h-3.5 text-primary" />
                  <span>Progress & Checkmarks Backup</span>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {completedCount} items marked done
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Because data stays strictly private in your browser, checkmarks do not automatically transfer between different devices or browsers. You can export a backup file and restore it on any device.
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="h-7 px-2.5 rounded border border-border bg-muted/30 hover:bg-muted/60 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3 h-3 text-muted-foreground" />
                  <span>Export Backup (.json)</span>
                </button>
                <label className="h-7 px-2.5 rounded border border-border bg-muted/30 hover:bg-muted/60 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                  <Upload className="w-3 h-3 text-muted-foreground" />
                  <span>Restore from File</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportBackup}
                    className="sr-only"
                  />
                </label>
              </div>
              {backupMessage && (
                <p className={`text-[11px] font-semibold ${backupMessage.isError ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {backupMessage.text}
                </p>
              )}
            </div>

            {/* Error & Success Messages */}
            {verificationError && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs font-semibold text-destructive border border-destructive/20">
                {verificationError}
              </div>
            )}

            {verificationSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Connected successfully! Verifying access and loading your courses...</span>
              </div>
            )}
          </div>

          {/* Dialog Footer Actions */}
          <div className="p-4 bg-muted/20 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onEnableDemoMode();
                onClose();
              }}
              className="h-9 px-3 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Explore Demo Mode</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3.5 rounded-md border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || (!digitalToken && !kfToken)}
                className="h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>Verifying...</>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save & Connect</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
