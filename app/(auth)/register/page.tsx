"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrengthBar } from "@/components/ui/password-strength-bar";
import { fadeInUp } from "@/lib/animations";
import { AuthFooter } from "@/components/auth/AuthFooter";
import {
  ProviderButton,
  ProviderIconImage,
} from "@/components/auth/ProviderButton";
import {
  getPasswordStrength,
  MIN_STRENGTH_PERCENTAGE,
} from "@/auth/validators/passwordStrength";
import { Smartphone } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
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
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPhoneLoading(false);
    }
  }

  const strength = React.useMemo(() => getPasswordStrength(password), [password]);
  const isStrongEnough = strength.percentage >= MIN_STRENGTH_PERCENTAGE;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isStrongEnough) {
      setError("Password is too weak. Please choose a stronger password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          deviceFingerprint: getDeviceFingerprint(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        if (data.shadowBanned) router.push("/help");
        return;
      }
      router.push("/onboarding");
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
              Create your Circle account
            </h1>
            <p className="text-gray-600 mt-2 dark:text-white/90">
              Join Circle to get started.
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
                  text="Sign up with Phone Number"
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
                    or sign up with email
                  </span>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reg-email"
                    className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                  >
                    Email
                  </label>
                  <Input
                    id="reg-email"
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
                    htmlFor="reg-name"
                    className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                  >
                    Name (optional)
                  </label>
                  <Input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-password"
                    className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                  >
                    Password (min 8 characters)
                  </label>
                  <Input
                    id="reg-password"
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
                {error && (
                  <p className="text-sm text-rose-400" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || (password.length > 0 && !isStrongEnough)}
                >
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-white/50">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-violet-600 underline underline-offset-2 hover:text-violet-700 dark:text-white/80 dark:hover:text-white"
                >
                  Sign in
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

