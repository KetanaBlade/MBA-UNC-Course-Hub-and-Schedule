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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-card border border-border/80 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Dialog Header (Recipe 5.7) */}
        <div className="p-5 border-b border-border/40 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-primary" />
            <h3 id="wizard-title" className="text-lg font-semibold text-foreground tracking-tight font-sans">
              Canvas Integration Setup
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close setup dialog"
            className="text-muted-foreground hover:text-foreground rounded-sm p-1 cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Body (Recipe 5.7) */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 text-sm font-medium text-foreground">
            {/* Explainer Box */}
            <div className="bg-muted/20 border border-border/70 rounded-md p-3.5 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>Why does UNC MBA use two Canvas sites?</span>
              </div>
              <p className="leading-relaxed">
                The program uses <strong className="text-foreground">digitalcampus.instructure.com</strong> (for 2U live synchronous delivery & orientation) and <strong className="text-foreground">kenan-flagler.instructure.com</strong> (for core courses & electives). This app stitches both into a single weekly schedule.
              </p>
            </div>

            {/* Site 1: DigitalCampus (Recipe 5.4 Form Input) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>1. DigitalCampus Token</span>
                <a
                  href="https://digitalcampus.instructure.com/profile/settings#access_tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] text-primary uppercase font-semibold hover:underline flex items-center gap-1"
                >
                  Generate Token <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <div className="relative">
                <input
                  type={showDigitalToken ? "text" : "password"}
                  value={digitalToken}
                  onChange={(e) => setDigitalToken(e.target.value)}
                  placeholder="1079~abcdef123456..."
                  className="w-full h-10 px-3 pr-10 rounded-md bg-card border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowDigitalToken(!showDigitalToken)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showDigitalToken ? "Hide token" : "Show token"}
                >
                  {showDigitalToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Site 2: Kenan-Flagler (Recipe 5.4 Form Input) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>2. Kenan-Flagler Token</span>
                <a
                  href="https://kenan-flagler.instructure.com/profile/settings#access_tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] text-primary uppercase font-semibold hover:underline flex items-center gap-1"
                >
                  Generate Token <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <div className="relative">
                <input
                  type={showKfToken ? "text" : "password"}
                  value={kfToken}
                  onChange={(e) => setKfToken(e.target.value)}
                  placeholder="1104~xyz789012345..."
                  className="w-full h-10 px-3 pr-10 rounded-md bg-card border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKfToken(!showKfToken)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showKfToken ? "Hide token" : "Show token"}
                >
                  {showKfToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Zero-Storage Privacy Guarantee */}
            <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong className="font-semibold">Zero-Storage Privacy: </strong>
                Your tokens are stored strictly in your browser localStorage. They are never saved to a database or server disk.
              </p>
            </div>

            {/* Messages */}
            {verificationError && (
              <div className="rounded-md bg-destructive/10 p-2.5 text-xs font-semibold text-destructive border border-destructive/20">
                {verificationError}
              </div>
            )}

            {verificationSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Connected successfully! Loading your courses...</span>
              </div>
            )}
          </div>

          {/* Dialog Footer Actions (Recipe 5.7) */}
          <div className="p-4 bg-muted/20 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onEnableDemoMode();
                onClose();
              }}
              className="h-9 px-3 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Explore Demo Mode</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3 rounded-md border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
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
