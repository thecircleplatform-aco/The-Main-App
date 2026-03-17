"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function ForgotPasswordPage() {
  const [mode, setMode] = React.useState<"choose" | "email" | "admin">("choose");
  const [email, setEmail] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }
      setMessage(data.message ?? "If an account exists, you will receive a reset link shortly.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleContactAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/support/password-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }
      setMessage(data.message ?? "Your request has been submitted. An admin will review it.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh px-4 pb-20 pt-14 md:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
          <div className="text-center">
            <Image src="/logo.svg" alt="" width={48} height={48} className="mx-auto h-12 w-12 mb-3" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Forgot password?</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
              Reset using email or request help from an admin.
            </p>
          </div>

          <GlassPanel className="p-6 sm:p-8 space-y-6">
            {mode === "choose" && (
              <>
                <div>
                  <h2 className="text-sm font-medium text-white/90">Reset using email</h2>
                  <p className="mt-1 text-xs text-white/60">
                    We will send a secure link to your email to set a new password.
                  </p>
                  <Button type="button" className="mt-3 w-full" onClick={() => setMode("email")}>
                    Send reset link
                  </Button>
                </div>
                <div className="border-t border-white/15 pt-4">
                  <h2 className="text-sm font-medium text-white/90">Cannot access your email?</h2>
                  <p className="mt-1 text-xs text-white/60">
                    Request manual recovery. An admin will review and may send you a reset link.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-3 w-full border border-white/20"
                    onClick={() => setMode("admin")}
                  >
                    Contact admin for help
                  </Button>
                </div>
              </>
            )}

            {mode === "email" && (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70">
                    Email
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {message && <p className="text-sm text-emerald-400" role="status">{message}</p>}
                {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    disabled={loading}
                    onClick={() => { setMode("choose"); setMessage(null); setError(null); }}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </div>
              </form>
            )}

            {mode === "admin" && (
              <form onSubmit={handleContactAdmin} className="space-y-4">
                <div>
                  <label htmlFor="recovery-email" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70">
                    Email
                  </label>
                  <Input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="recovery-reason" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70">
                    Describe your situation (min 10 characters)
                  </label>
                  <textarea
                    id="recovery-reason"
                    rows={4}
                    className="w-full rounded-2xl border border-violet-200/80 bg-white/80 px-4 py-3 text-violet-950 placeholder:text-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
                    placeholder="e.g. I no longer have access to this email and need to recover my account."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    minLength={10}
                    disabled={loading}
                  />
                </div>
                {message && <p className="text-sm text-emerald-400" role="status">{message}</p>}
                {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    disabled={loading}
                    onClick={() => { setMode("choose"); setMessage(null); setError(null); }}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Submitting…" : "Submit request"}
                  </Button>
                </div>
              </form>
            )}

            <AuthFooter />
          </GlassPanel>

          <p className="text-center">
            <Link href="/login" className="text-sm text-violet-600 underline underline-offset-2 dark:text-white/80">
              Back to sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
