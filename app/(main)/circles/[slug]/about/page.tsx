"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Users, Megaphone } from "lucide-react";
import { CircleAvatar } from "@/components/circles/CircleAvatar";
import { cn } from "@/lib/utils";

type CircleData = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  member_count: number;
  circle_image_url?: string | null;
};

export default function CircleAboutPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params?.slug ?? null;
  const [circle, setCircle] = React.useState<CircleData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "chat" | "updates" | "members"
  >("chat");

  React.useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setLoadError(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    fetch(`${origin}/api/circles/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404 ? "Circle not found" : "Failed to load"
          );
        return res.json();
      })
      .then((data: CircleData) => {
        setCircle(data);
      })
      .catch((e) => setLoadError(e?.message ?? "Failed to load circle"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading || !slug) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50/80 dark:bg-black/80">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (loadError || !circle) {
    return (
      <div
        className="min-h-dvh bg-gray-50/80 dark:bg-black/80 flex flex-col items-center justify-center p-6"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
          {loadError ?? "Circle not found"}
        </p>
        <Link
          href="/circles"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explore Circles
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh w-full bg-gray-50/80 dark:bg-black/80 flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <header className="shrink-0 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link
            href="/circles"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
            aria-label="Back to circles"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CircleAvatar
              name={circle.name}
              imageUrl={circle.circle_image_url ?? null}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {circle.name}
              </h1>
              <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/50">
                <Users className="h-3.5 w-3" aria-hidden />
                {circle.member_count}{" "}
                {circle.member_count === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2 flex gap-1 border-t border-gray-100 dark:border-white/5 pt-2 mt-0">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              activeTab === "chat"
                ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("updates")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium inline-flex items-center gap-1.5",
              activeTab === "updates"
                ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            <Megaphone className="h-3.5 w-3.5" />
            Updates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              activeTab === "members"
                ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            Members
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-4">
        <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            About this circle
          </h2>
          <p className="text-sm text-gray-700 dark:text-white/70 whitespace-pre-wrap">
            {circle.description || "No description provided yet."}
          </p>
          <p className="mt-3 text-xs text-gray-500 dark:text-white/50">
            Active tab: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </p>
        </section>
      </main>
    </div>
  );
}

