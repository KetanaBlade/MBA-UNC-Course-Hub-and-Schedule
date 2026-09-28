"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { StudentAuthTokens } from "@/lib/canvas/types";

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTokens: (tokens: StudentAuthTokens) => Promise<boolean>;
  onEnableDemoMode: () => void;
  initialTokens: StudentAuthTokens;
}

export function SetupWizard({
  isOpen,
  onClose,
  onSaveTokens,
  onEnableDemoMode,
  initialTokens,
}: SetupWizardProps) {
  const [digitalToken, setDigitalToken] = useState(initialTokens.digitalCampusToken);
  const [kfToken, setKfToken] = useState(initialTokens.kenanFlaglerToken);
  const [showDigitalToken, setShowDigitalToken] = useState(false);
  const [showKfToken, setShowKfToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-card p-6 sm:p-7 shadow-2xl border border-border">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close setup dialog"
          className="btn-tactile absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground touch-target"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#13294B] text-[#4B9CD3]">
            <Key className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 id="wizard-title" className="text-lg font-bold tracking-tight text-foreground font-sans">
              Canvas Integration Setup
            </h2>
            <p className="text-xs text-muted-foreground">UNC Kenan-Flagler Online MBA Cohort Portal</p>
          </div>
        </div>

        {/* Explainer Box (De-boxified inner-strip) */}
        <div className="mt-4 inner-strip p-3.5 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-[#4B9CD3]" />
            Why does UNC MBA use two Canvas sites?
          </div>
          <p className="leading-relaxed">
            The program uses <strong className="text-foreground">digitalcampus.instructure.com</strong> (for 2U live synchronous delivery & orientation) and <strong className="text-foreground">kenan-flagler.instructure.com</strong> (for core courses & electives). This app stitches both into a single weekly schedule.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Site 1: DigitalCampus */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="digitalcampus-token"
                className="block text-xs font-bold uppercase tracking-wider text-foreground/80 font-sans"
              >
                1. DigitalCampus Canvas Token
              </label>
              <a
                href="https://digitalcampus.instructure.com/profile/settings#access_tokens"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#4B9CD3] hover:underline"
              >
                Generate Token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Account &rarr; Settings &rarr; + New Access Token
            </p>
            <div className="relative">
              <input
                id="digitalcampus-token"
                type={showDigitalToken ? "text" : "password"}
                value={digitalToken}
                onChange={(e) => setDigitalToken(e.target.value)}
                placeholder="1079~abcdef123456..."
                className="w-full rounded-md border border-border bg-white dark:bg-card px-3 py-2 pr-9 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-[#4B9CD3] focus:outline-none focus:ring-1 focus:ring-[#4B9CD3]"
              />
              <button
                type="button"
                onClick={() => setShowDigitalToken(!showDigitalToken)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label={showDigitalToken ? "Hide token" : "Show token"}
              >
                {showDigitalToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Site 2: Kenan-Flagler */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="kf-token"
                className="block text-xs font-bold uppercase tracking-wider text-foreground/80 font-sans"
              >
                2. Kenan-Flagler Canvas Token
              </label>
              <a
                href="https://kenan-flagler.instructure.com/profile/settings#access_tokens"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#4B9CD3] hover:underline"
              >
                Generate Token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Account &rarr; Settings &rarr; + New Access Token
            </p>
            <div className="relative">
              <input
                id="kf-token"
                type={showKfToken ? "text" : "password"}
                value={kfToken}
                onChange={(e) => setKfToken(e.target.value)}
                placeholder="1104~xyz789012345..."
                className="w-full rounded-md border border-border bg-white dark:bg-card px-3 py-2 pr-9 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-[#4B9CD3] focus:outline-none focus:ring-1 focus:ring-[#4B9CD3]"
              />
              <button
                type="button"
                onClick={() => setShowKfToken(!showKfToken)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label={showKfToken ? "Hide token" : "Show token"}
              >
                {showKfToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Zero-Storage Privacy Guarantee */}
          <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Zero-Storage Privacy: </span>
              Tokens reside strictly in your device&apos;s browser localStorage. They are never saved to a database or server disk.
            </div>
          </div>

          {/* Messages */}
          {verificationError && (
            <div className="rounded-md bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-800 dark:text-rose-300 border border-rose-500/20">
              {verificationError}
            </div>
          )}

          {verificationSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Connected successfully! Loading your courses...
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                onEnableDemoMode();
                onClose();
              }}
              className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition touch-target"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              Explore Demo Mode
            </button>

            <button
              type="submit"
              disabled={isVerifying || (!digitalToken && !kfToken)}
              className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-[#13294B] px-5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#1a3866] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] disabled:opacity-50 touch-target"
            >
              {isVerifying ? (
                <>Verifying Accounts...</>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-[#4B9CD3]" />
                  Save & Connect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
