"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      router.push("/");
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
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white">Create account</h1>
            <p className="mt-1 text-sm text-white/60">
              Join Circle to use the AI council
            </p>
          </div>

          <GlassPanel className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reg-email"
                  className="mb-1.5 block text-xs font-medium text-white/70"
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
                  className="mb-1.5 block text-xs font-medium text-white/70"
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
                  className="mb-1.5 block text-xs font-medium text-white/70"
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
              </div>
              {error && (
                <p className="text-sm text-rose-400" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-white/50">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-white/80 underline underline-offset-2 hover:text-white"
              >
                Sign in
              </Link>
            </p>
          </GlassPanel>

          <p className="text-center">
            <Link
              href="/"
              className="text-sm text-white/50 hover:text-white/70"
            >
              ← Back to Circle
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
