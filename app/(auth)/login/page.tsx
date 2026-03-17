"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AuthFooter } from "@/components/auth/AuthFooter";
import {
  ProviderButton,
  ProviderIconImage,
} from "@/components/auth/ProviderButton";
import { Smartphone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";
  const deleted = searchParams.get("deleted") === "1";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [phoneMode, setPhoneMode] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [otpExpiresAt, setOtpExpiresAt] = React.useState<number | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = React.useState<number | null>(
    null
  );
  const [phoneLoading, setPhoneLoading] = React.useState(false);

  React.useEffect(() => {
    if (otpExpiresAt == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setOtpSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [otpExpiresAt]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send code.");
        return;
      }
      setOtpSent(true);
      setOtpExpiresAt(Date.now() + (data.expiresInSeconds ?? 300) * 1000);
      setOtpCode("");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          otp: otpCode,
          deviceId: getDeviceFingerprint(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      router.push(from.startsWith("/") ? from : "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          deviceId: getDeviceFingerprint(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        if (data.blocked) router.push("/help");
        return;
      }
      router.push(from.startsWith("/") ? from : "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh px-4 pb-20 pt-14 md:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center">
        <div className="space-y-6">
          {/* Header outside motion so it's never transparent in light theme */}
          <div className="auth-page-header text-center">
            <div className="flex items-center justify-center mb-3 [&_img]:[filter:drop-shadow(0_0_2px_rgba(0,0,0,0.5))_drop-shadow(0_2px_8px_rgba(0,0,0,0.3))] dark:[&_img]:[filter:none]">
              <Image
                src="/logo.svg"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12"
              />
            </div>
            <h1 className="text-gray-900 font-semibold text-3xl dark:text-white">
              Welcome back
            </h1>
            <p className="text-gray-600 mt-2 dark:text-white/90">
              {deleted
                ? "Your account is scheduled for deletion. Sign in to recover it within 7 days."
                : "Sign in to your Circle account"}
            </p>
          </div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <GlassPanel className="p-6 sm:p-8">
              <ProviderButton
                icon={<ProviderIconImage src="/aco-logo.svg" />}
                text="Continue with ACO"
                onClick={() =>
                  document
                    .getElementById("auth-footer")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    })
                }
              />
              <ProviderButton
                icon={<ProviderIconImage src="/google.svg" />}
                text="Continue with Google"
                href="/api/auth/signin/google"
              />
              <ProviderButton
                icon={<ProviderIconImage src="/github.svg" darkInvert />}
                text="Continue with GitHub"
                href="/api/auth/signin/github"
              />
              {!phoneMode ? (
                <ProviderButton
                  icon={<Smartphone className="h-6 w-6" />}
                  text="Login with Phone Number"
                  onClick={() => setPhoneMode(true)}
                />
              ) : (
                <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200/70 bg-white/60 dark:border-white/10 dark:bg-white/5 p-4">
                  <AnimatePresence mode="wait">
                    {!otpSent ? (
                      <motion.form
                        key="phone"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleSendOtp}
                        className="space-y-3"
                      >
                        <div className="flex gap-2">
                          <Input
                            type="tel"
                            placeholder="+1 555 123 4567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={phoneLoading}
                            className="flex-1"
                            autoFocus
                          />
                          <Button type="submit" disabled={phoneLoading}>
                            {phoneLoading ? "Sending…" : "Send OTP"}
                          </Button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneMode(false);
                            setError(null);
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/70"
                        >
                          ← Back to options
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="otp"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleVerifyOtp}
                        className="space-y-3"
                      >
                        <p className="text-xs text-gray-600 dark:text-white/70">
                          Code sent to {phoneNumber}
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={otpCode}
                            onChange={(e) =>
                              setOtpCode(
                                e.target.value.replace(/\D/g, "").slice(0, 6)
                              )
                            }
                            disabled={phoneLoading}
                            className="flex-1 text-center font-mono text-lg tracking-widest"
                          />
                          <Button
                            type="submit"
                            disabled={
                              phoneLoading ||
                              (otpSecondsLeft !== null && otpSecondsLeft <= 0)
                            }
                          >
                            {phoneLoading ? "Verifying…" : "Verify"}
                          </Button>
                        </div>
                        {otpSecondsLeft !== null && (
                          <p className="text-xs text-gray-500 dark:text-white/50">
                            {otpSecondsLeft > 0
                              ? `Code expires in ${otpSecondsLeft}s`
                              : "Code expired. Request a new code below."}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpExpiresAt(null);
                              setOtpSecondsLeft(null);
                              setError(null);
                            }}
                            disabled={phoneLoading}
                            className="text-xs text-violet-600 hover:text-violet-700 dark:text-white/80 dark:hover:text-white"
                          >
                            Use different number
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneMode(false);
                              setOtpSent(false);
                              setOtpExpiresAt(null);
                              setError(null);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/70"
                          >
                            ← Back to options
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                  {error && (
                    <p className="mt-2 text-sm text-rose-400" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              )}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-white/15" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-transparent px-2 text-gray-500 dark:text-white/50">
                    or sign in with email
                  </span>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                  >
                    Email
                  </label>
                  <Input
                    id="login-email"
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
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                  >
                    Password
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-rose-400" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
                <p className="text-center text-sm text-gray-600 dark:text-white/50">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-violet-600 underline underline-offset-2 hover:text-violet-700 dark:text-white/80 dark:hover:text-white"
                  >
                    Forgot password?
                  </Link>
                </p>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-white/50">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-violet-600 underline underline-offset-2 hover:text-violet-700 dark:text-white/80 dark:hover:text-white"
                >
                  Register
                </Link>
              </p>

              <AuthFooter />
            </GlassPanel>

            <p className="text-center">
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white/70"
              >
                ← Back to Circle
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

