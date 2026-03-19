"use client";

import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

function Card({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-4",
        "border-violet-200/70 bg-white/80 backdrop-blur-xl shadow-[0_14px_45px_rgba(15,23,42,0.10)]",
        "dark:border-white/10 dark:bg-white/5 dark:shadow-[0_14px_45px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/10 text-violet-700 ring-1 ring-violet-500/15 dark:bg-white/10 dark:text-violet-200 dark:ring-white/10">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-violet-950 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="text-[13px] leading-relaxed text-violet-900/80 dark:text-white/70">
        {children}
      </div>
    </section>
  );
}

export default function EndToEndEncryptionPage() {
  return (
    <div
      className={cn(
        "min-h-dvh w-full",
        "bg-violet-50/60 text-slate-900",
        "dark:bg-transparent dark:text-slate-100"
      )}
      style={{
        paddingTop: "calc(56px + env(safe-area-inset-top))",
        paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/circles"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full border",
              "border-violet-200/70 bg-white/80 text-violet-900 hover:bg-white",
              "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            )}
            aria-label="Back"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-violet-700 dark:text-violet-200" />
              <h1 className="truncate text-base font-semibold text-violet-950 dark:text-white">
                End‑to‑end encryption
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-violet-700/70 dark:text-white/55">
              What it means in Circle (ACO Ghosts Security).
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <Card title="What this protects" icon={<ShieldCheck className="h-4 w-4" />}>
            Messages are encrypted so only the people in the conversation can read
            them. Servers can deliver messages, but they shouldn&apos;t be able to
            see the contents.
          </Card>

          <Card title="How keys work (high level)" icon={<KeyRound className="h-4 w-4" />}>
            Your device uses encryption keys to lock and unlock messages. When you
            send a message, it&apos;s locked on your device and only the recipient
            can unlock it on their device.
          </Card>

          <Card title="What to keep in mind" icon={<Lock className="h-4 w-4" />}>
            End‑to‑end encryption doesn&apos;t prevent someone with access to your
            unlocked device (or screenshots) from seeing content. Keep your device
            secure and use a screen lock.
          </Card>
        </div>

        <div className="mt-4 rounded-2xl border border-violet-200/70 bg-white/70 p-4 text-xs text-violet-900/80 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
          This page is an explainer for users. If you want, I can also add a short
          FAQ (data backup, device changes, reporting, etc.).
        </div>
      </div>
    </div>
  );
}

