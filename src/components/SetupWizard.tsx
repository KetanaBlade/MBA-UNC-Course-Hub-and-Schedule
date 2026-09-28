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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close setup dialog"
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] touch-target"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13294B] text-[#4B9CD3]">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 id="wizard-title" className="text-xl font-bold tracking-tight text-slate-900">
              Canvas Integration Setup
            </h2>
            <p className="text-xs text-slate-500">UNC Kenan-Flagler Online MBA Cohort Portal</p>
          </div>
        </div>

        {/* Why two Canvas sites? Explainer box */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <HelpCircle className="h-4 w-4 text-[#4B9CD3]" />
            Why does UNC MBA use two Canvas sites?
          </div>
          <p>
            The program uses <strong className="text-slate-700">digitalcampus.instructure.com</strong> (for 2U live synchronous delivery and orientation) and <strong className="text-slate-700">kenan-flagler.instructure.com</strong> (for business school core courses & electives). This app automatically stitches both into a single cohesive weekly schedule!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Site 1: DigitalCampus */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="digitalcampus-token"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                1. DigitalCampus Canvas Token
              </label>
              <a
                href="https://digitalcampus.instructure.com/profile/settings#access_tokens"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#4B9CD3] hover:underline"
              >
                Generate Token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-slate-500">
              Account &rarr; Settings &rarr; + New Access Token (Purpose: MBA Hub)
            </p>
            <div className="relative">
              <input
                id="digitalcampus-token"
                type={showDigitalToken ? "text" : "password"}
                value={digitalToken}
                onChange={(e) => setDigitalToken(e.target.value)}
                placeholder="e.g. 1079~abcdef123456..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-[#4B9CD3] focus:outline-none focus:ring-2 focus:ring-[#4B9CD3]/20"
              />
              <button
                type="button"
                onClick={() => setShowDigitalToken(!showDigitalToken)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label={showDigitalToken ? "Hide token" : "Show token"}
              >
                {showDigitalToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Site 2: Kenan-Flagler */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="kf-token"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                2. Kenan-Flagler Canvas Token
              </label>
              <a
                href="https://kenan-flagler.instructure.com/profile/settings#access_tokens"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#4B9CD3] hover:underline"
              >
                Generate Token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-slate-500">
              Account &rarr; Settings &rarr; + New Access Token
            </p>
            <div className="relative">
              <input
                id="kf-token"
                type={showKfToken ? "text" : "password"}
                value={kfToken}
                onChange={(e) => setKfToken(e.target.value)}
                placeholder="e.g. 1104~xyz789012345..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-[#4B9CD3] focus:outline-none focus:ring-2 focus:ring-[#4B9CD3]/20"
              />
              <button
                type="button"
                onClick={() => setShowKfToken(!showKfToken)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label={showKfToken ? "Hide token" : "Show token"}
              >
                {showKfToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Privacy & FERPA Security Guarantee */}
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50/80 p-3 text-xs text-emerald-800 border border-emerald-200/60">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Zero-Storage Privacy Guarantee: </span>
              Your tokens are stored strictly in your device&apos;s local browser storage. They are never sent to a shared database or stored on any server.
            </div>
          </div>

          {/* Error Message */}
          {verificationError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200">
              {verificationError}
            </div>
          )}

          {/* Success Message */}
          {verificationSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-100 p-3 text-xs font-medium text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Canvas accounts connected successfully! Loading your courses...
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onEnableDemoMode();
                onClose();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-300 transition touch-target"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Explore Demo Mode First
            </button>

            <button
              type="submit"
              disabled={isVerifying || (!digitalToken && !kfToken)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#13294B] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3866] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3] disabled:opacity-50 touch-target"
            >
              {isVerifying ? (
                <>Verifying Accounts...</>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-[#4B9CD3]" />
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
