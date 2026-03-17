"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Search, Star, Users } from "lucide-react";
import { CircleAvatar } from "@/components/circles/CircleAvatar";
import { cn } from "@/lib/utils";

type Circle = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  member_count: number;
  members?: number;
  circle_image_url?: string | null;
};

const TRENDING_COUNT = 6;

type TabKey = "all" | "trending" | "recent";

function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function ExploreCirclesPage() {
  const [circles, setCircles] = React.useState<Circle[]>([]);
  const [mySlugs, setMySlugs] = React.useState<Set<string>>(new Set());
  const [tab, setTab] = React.useState<TabKey>("all");
  const [loading, setLoading] = React.useState(true);
  const [joinLoadingSlug, setJoinLoadingSlug] = React.useState<string | null>(
    null
  );
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadCircles = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/circles`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data)) {
        const bySlug = new Map<string, Circle>();
        for (const c of data) {
          if (c?.slug && !bySlug.has(c.slug)) bySlug.set(c.slug, c);
        }
        setCircles(Array.from(bySlug.values()));
      } else if (!res.ok) {
        setLoadError(data?.error || `Failed to load circles (${res.status})`);
        setCircles([]);
      } else {
        setCircles(Array.isArray(data) ? data : []);
      }
    } catch {
      setLoadError("Could not reach the server. Try again.");
      setCircles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyCircles = React.useCallback(async () => {
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/circles/my`, {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setMySlugs(new Set(list.map((c: Circle) => c.slug)));
      }
    } catch {
      setMySlugs(new Set());
    }
  }, []);

  React.useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  React.useEffect(() => {
    loadMyCircles();
  }, [loadMyCircles]);

  const handleJoin = React.useCallback(
    async (slug: string) => {
      if (joinLoadingSlug) return;
      setJoinError(null);
      setJoinLoadingSlug(slug);
      try {
        const res = await fetch("/api/circles/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ circleSlug: slug }),
          credentials: "include",
        });
        if (res.ok) {
          setMySlugs((prev) => new Set([...prev, slug]));
          setCircles((prev) =>
            prev.map((c) =>
              c.slug === slug
                ? { ...c, member_count: c.member_count + 1 }
                : c
            )
          );
        } else if (res.status === 401) {
          setJoinError("Please log in to join circles.");
        } else {
          const data = await res.json().catch(() => ({}));
          setJoinError(data?.error || "Could not join circle.");
        }
      } finally {
        setJoinLoadingSlug(null);
      }
    },
    [joinLoadingSlug]
  );

  const trending = React.useMemo(
    () =>
      [...circles]
        .sort((a, b) => b.member_count - a.member_count)
        .slice(0, TRENDING_COUNT),
    [circles]
  );

  const sortedRecent = React.useMemo(() => [...circles].reverse(), [circles]);

  const list = React.useMemo(() => {
    if (tab === "trending") return trending;
    if (tab === "recent") return sortedRecent;
    return circles;
  }, [circles, sortedRecent, tab, trending]);

  return (
    <div className="relative min-h-dvh w-full">
      {/* Full-bleed background so the main layout max-width doesn't reveal page bg */}
      <div className="fixed inset-0 z-[-1] circle-chat-bg" aria-hidden="true" />

      <div
        className="mx-auto max-w-6xl px-4 py-4"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabPill
            active={tab === "all"}
            onClick={() => setTab("all")}
            leading={<span className="text-white/90">All</span>}
            trailing={
              <span className="ml-2 rounded-full bg-sky-400/35 px-2 py-0.5 text-[11px] font-semibold text-white border border-white/10">
                {circles.length || 0}
              </span>
            }
          />
          <TabPill
            active={tab === "trending"}
            onClick={() => setTab("trending")}
            leading={
              <span className="inline-flex items-center gap-2 text-white/90">
                <Flame className="h-4 w-4 text-orange-300" aria-hidden />
                Trending
              </span>
            }
          />
          <TabPill
            active={tab === "recent"}
            onClick={() => setTab("recent")}
            leading={
              <span className="inline-flex items-center gap-2 text-white/90">
                <Search className="h-4 w-4 text-white/70" aria-hidden />
                Recent
              </span>
            }
          />
        </div>

        {loadError && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 backdrop-blur-xl">
            <span className="text-white/75">{loadError}</span>
            <button
              type="button"
              onClick={() => loadCircles()}
              className="shrink-0 font-semibold text-white underline"
            >
              Retry
            </button>
          </div>
        )}

        {joinError && (
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 backdrop-blur-xl">
            {joinError}{" "}
            <Link href="/login" className="ml-2 font-medium underline">
              Log in
            </Link>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-300/70 border-t-transparent" />
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            {list.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-sm text-white/65 backdrop-blur-xl">
                No circles found.
              </div>
            ) : (
              list.map((c, idx) => (
                <CircleRow
                  key={c.id ?? c.slug ?? idx}
                  circle={c}
                  isTrending={tab === "trending"}
                  isJoined={mySlugs.has(c.slug)}
                  onJoin={handleJoin}
                  joinLoading={joinLoadingSlug === c.slug}
                  activityCount={((idx * 7) % 19) + 1}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabPill(props: {
  active: boolean;
  onClick: () => void;
  leading: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const { active, onClick, leading, trailing } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center rounded-full px-4 py-2 text-[13px] font-semibold",
        "border backdrop-blur-xl transition-colors",
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 active:bg-white/12"
      )}
    >
      {leading}
      {trailing}
    </button>
  );
}

function CircleRow(props: {
  circle: Circle;
  isTrending: boolean;
  isJoined: boolean;
  onJoin: (slug: string) => void;
  joinLoading: boolean;
  activityCount: number;
}) {
  const { circle, isTrending, isJoined, onJoin, joinLoading, activityCount } =
    props;

  return (
    <Link
      href={`/circles/${encodeURIComponent(circle.slug)}`}
      className={cn(
        "group flex items-center gap-4 rounded-2xl px-3 py-3",
        "hover:bg-white/5 active:bg-white/7 transition-colors"
      )}
    >
      <CircleAvatar
        name={circle.name}
        imageUrl={circle.circle_image_url ?? null}
        size="sm"
        className="h-14 w-14"
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-semibold text-white/95">
          {circle.name}
        </div>
        <div className="truncate text-[13px] text-white/60">
          {circle.description || "Join the conversation."}
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-white/45">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {formatMemberCount(circle.member_count)} members
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold",
            "border border-white/10 bg-white/5 text-white/80 backdrop-blur-xl"
          )}
        >
          <Star className="h-3.5 w-3.5 text-white/55" aria-hidden />
          {formatMemberCount(circle.member_count)}
          {isTrending && <span className="ml-1 text-emerald-300">↓</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJoin(circle.slug);
            }}
            disabled={joinLoading || isJoined}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-semibold",
              "border border-white/10 backdrop-blur-xl",
              isJoined
                ? "bg-white/5 text-emerald-200/90"
                : "bg-sky-400/25 text-white hover:bg-sky-400/30 active:bg-sky-400/35"
            )}
          >
            {joinLoading ? "…" : isJoined ? "Joined" : "Join"}
          </button>

          <div
            className={cn(
              "min-w-8 text-center rounded-full px-3 py-1 text-[12px] font-semibold",
              "bg-sky-400/25 text-white border border-white/10 backdrop-blur-xl"
            )}
            aria-label={`${activityCount} activity`}
          >
            {activityCount}
          </div>
        </div>
      </div>
    </Link>
  );
}

