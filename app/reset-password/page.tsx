"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrengthBar } from "@/components/ui/password-strength-bar";
import { fadeInUp } from "@/lib/animations";
import { AuthFooter } from "@/components/auth/AuthFooter";
import {
  getPasswordStrength,
  MIN_STRENGTH_PERCENTAGE,
} from "@/auth/validators/passwordStrength";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const strength = React.useMemo(
    () => getPasswordStrength(password),
    [password]
  );
  const isStrongEnough = strength.percentage >= MIN_STRENGTH_PERCENTAGE;
  const match = password.length > 0 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing reset link. Please use the link from your email.");
      return;
    }
    if (!isStrongEnough) {
      setError("Password is too weak. Please choose a stronger password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Reset failed.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh px-4 pb-20 pt-14 md:px-8">
        <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="space-y-6 text-center"
          >
            <Image src="/logo.svg" alt="" width={48} height={48} className="mx-auto h-12 w-12 mb-3" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Password updated
            </h1>
            <p className="text-sm text-gray-600 dark:text-white/60">
              You can now sign in with your new password.
            </p>
            <Button
              className="w-full max-w-xs mx-auto"
              onClick={() => router.push("/login")}
            >
              Sign in
            </Button>
            <p className="text-center">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-white/50"
              >
                ← Back to Circle
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-dvh px-4 pb-20 pt-14 md:px-8">
        <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="space-y-6 text-center"
          >
            <Image src="/logo.svg" alt="" width={48} height={48} className="mx-auto h-12 w-12 mb-3" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Invalid reset link
            </h1>
            <p className="text-sm text-gray-600 dark:text-white/60">
              This link is missing or invalid. Request a new password reset from the login page.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full max-w-xs mx-auto">
                Forgot password
              </Button>
            </Link>
            <p className="text-center">
              <Link
                href="/login"
                className="text-sm text-violet-600 underline dark:text-white/80"
              >
                ← Back to sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 pb-20 pt-14 md:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <div className="text-center">
            <Image src="/logo.svg" alt="" width={48} height={48} className="mx-auto h-12 w-12 mb-3" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Set new password
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
              Enter and confirm your new password.
            </p>
          </div>

          <GlassPanel className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-password"
                  className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                >
                  New password
                </label>
                <Input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
                <PasswordStrengthBar
                  password={password}
                  className="mt-2"
                  showLabel
                  showSuggestions
                />
              </div>
              <div>
                <label
                  htmlFor="reset-confirm"
                  className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                >
                  Confirm password
                </label>
                <Input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
                {confirm.length > 0 && !match && (
                  <p className="mt-1 text-xs text-rose-400">Passwords do not match.</p>
                )}
              </div>
              {error && (
                <p className="text-sm text-rose-400" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  password.length < 8 ||
                  !match ||
                  (password.length > 0 && !isStrongEnough)
                }
              >
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>

            <AuthFooter />
          </GlassPanel>

          <p className="text-center">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/70"
            >
              ← Back to sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
