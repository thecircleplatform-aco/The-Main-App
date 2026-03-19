"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Search, Users, ChevronRight, Plus, MessageCircle, Sparkles, Lock } from "lucide-react";
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
  const [joinedCircles, setJoinedCircles] = React.useState<Circle[]>([]);
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
        const list: Circle[] = Array.isArray(data) ? data : [];
        setMySlugs(new Set(list.map((c) => c.slug)));
        setJoinedCircles(list);
      } else if (res.status === 401) {
        // Not logged in – clear joined state and surface auth message.
        setMySlugs(new Set());
        setJoinedCircles([]);
        setJoinError("Please log in to see your joined circles.");
      }
      // For other non-ok statuses we leave existing state in place.
    } catch {
      // Network or server error – keep whatever we had instead of wiping UI.
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
          // Optimistic local update so the button / counts react immediately.
          setMySlugs((prev) => new Set([...prev, slug]));
          setCircles((prev) =>
            prev.map((c) =>
              c.slug === slug
                ? { ...c, member_count: c.member_count + 1 }
                : c
            )
          );
          setJoinedCircles((prev) => {
            if (prev.some((c) => c.slug === slug)) {
              return prev;
            }
            const fromCircles = circles.find((c) => c.slug === slug);
            return fromCircles ? [...prev, fromCircles] : prev;
          });

          // Immediately re-sync from DB so refreshes match real data.
          await loadMyCircles();
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
    [circles, joinLoadingSlug, loadMyCircles]
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

  const tabRowRef = React.useRef<HTMLDivElement | null>(null);

  const [exploreOpen, setExploreOpen] = React.useState(false);
  const [exploreSearch, setExploreSearch] = React.useState("");
  const [dragOffset, setDragOffset] = React.useState(0);
  const dragStartYRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const handler = () => setExploreOpen(true);
    window.addEventListener("open-explore-circles", handler);
    return () => window.removeEventListener("open-explore-circles", handler);
  }, []);

  const exploreList = React.useMemo(() => {
    let base = list;
    if (exploreSearch.trim()) {
      const q = exploreSearch.trim().toLowerCase();
      base = base.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q) ||
          (c.category ?? "").toLowerCase().includes(q)
      );
    }
    return base;
  }, [list, exploreSearch]);

  return (
    <div className="relative min-h-dvh w-full bg-violet-50/60 dark:bg-transparent">
      <div className="-mx-4 w-[calc(100%+2rem)] max-w-none px-0 py-0">
        {loadError && (
          <div className="mx-4 mb-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
            <div className="flex items-center justify-between">
              <span>{loadError}</span>
              <button onClick={() => loadCircles()} className="font-bold underline">Retry</button>
            </div>
          </div>
        )}

        <div className="px-0">
          {joinedCircles.length === 0 ? (
            <div className="py-20 text-center text-violet-700/70 dark:text-white/60">
              You have not joined any circles yet.
            </div>
          ) : (
            <div className="divide-y divide-violet-200/70 dark:divide-white/5">
              {joinedCircles.map((c, idx) => (
                <CircleRow
                  key={c.id ?? c.slug ?? idx}
                  circle={c}
                  isJoined={true}
                  onJoin={handleJoin}
                  joinLoading={false}
                />
              ))}
            </div>
          )}
          <div className="pb-20" /> {/* Spacer for footer */}
          <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+6px)]">
            <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 text-[11px] text-violet-700/70 dark:text-white/55">
              <Lock className="h-3.5 w-3.5 opacity-80" />
              <Link
                href="/security/end-to-end-encryption"
                className="font-semibold text-violet-700 hover:text-violet-900 underline-offset-2 hover:underline dark:text-white/80 dark:hover:text-white"
              >
                End‑to‑end encrypted
              </Link>
              <span>with ACO Ghosts Security</span>
            </div>
          </div>
        </div>
      </div>

      {exploreOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/35 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-6 duration-300">
          <button
            type="button"
            className="flex-1 cursor-default"
            aria-label="Close explore"
            onClick={() => setExploreOpen(false)}
          />
          <div
            className="relative max-h-[70vh] w-full rounded-t-3xl bg-[#0b071a] text-white shadow-[0_-18px_40px_rgba(15,23,42,0.85)] overflow-y-auto no-scrollbar focus:outline-none transition-transform duration-150"
            tabIndex={-1}
            style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}
          >
            <div className="sticky top-0 z-10 rounded-t-3xl bg-[#0b071a]/95 backdrop-blur-xl">
              <div
                className="flex justify-center pt-3 pb-2 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                  dragStartYRef.current = e.clientY;
                  setDragOffset(0);
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (dragStartYRef.current == null) return;
                  const delta = e.clientY - dragStartYRef.current;
                  if (delta > 0) {
                    setDragOffset(delta);
                  } else {
                    setDragOffset(0);
                  }
                }}
                onPointerUp={(e) => {
                  if (dragStartYRef.current == null) return;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  if (dragOffset > 40) {
                    setExploreOpen(false);
                  }
                  dragStartYRef.current = null;
                  setDragOffset(0);
                }}
                onPointerCancel={(e) => {
                  if (dragStartYRef.current == null) return;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  dragStartYRef.current = null;
                  setDragOffset(0);
                }}
              >
                <div className="h-1 w-10 rounded-full bg-white/25" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2">
                <div>
                  <h2 className="text-[13px] font-semibold tracking-wide uppercase text-white/80">
                    Explore circles
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/50">
                    Discover new communities to join.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExploreOpen(false)}
                  className="text-[12px] font-semibold text-white/70 hover:text-white"
                >
                  Done
                </button>
              </div>
              <div className="border-t border-white/10" />
            </div>

            <div className="px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="search"
                  value={exploreSearch}
                  onChange={(e) => setExploreSearch(e.target.value)}
                  placeholder="Search circles"
                  className="flex-1 rounded-full bg-white/5 px-3 py-1.5 text-[12px] text-white placeholder:text-white/40 outline-none ring-1 ring-white/15 focus:ring-violet-400/60"
                />
                <button
                  type="button"
                  onClick={() => setTab("trending")}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-violet-400 active:bg-violet-600"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>AI recommend</span>
                </button>
              </div>
              <div
                ref={tabRowRef}
                className="mb-3 flex w-full items-center gap-2 overflow-x-auto bg-transparent py-1 no-scrollbar overscroll-x-contain"
                style={{ WebkitOverflowScrolling: "touch" }}
                onWheel={(e) => {
                  const el = tabRowRef.current;
                  if (!el) return;
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.preventDefault();
                    el.scrollLeft += e.deltaY;
                    }
                }}
              >
                <TabPill
                  active={tab === "all"}
                  onClick={() => setTab("all")}
                  label="All"
                  count={circles.length}
                />
                <TabPill
                  active={tab === "trending"}
                  onClick={() => setTab("trending")}
                  label="Trending"
                  icon={<Flame className="h-3.5 w-3.5" />}
                />
                <TabPill
                  active={tab === "recent"}
                  onClick={() => setTab("recent")}
                  label="Recent"
                  icon={<Search className="h-3.5 w-3.5" />}
                />
              </div>

              <div className="mt-1 divide-y divide-white/5">
                {exploreList.length === 0 ? (
                  <div className="py-10 text-center text-sm text-white/50">
                    No circles found.
                  </div>
                ) : (
                  exploreList.map((c, idx) => (
                    <ExploreCircleRow
                      key={c.id ?? c.slug ?? idx}
                      circle={c}
                      isJoined={mySlugs.has(c.slug)}
                      onJoin={handleJoin}
                      joinLoading={joinLoadingSlug === c.slug}
                      rank={tab === "trending" ? idx + 1 : undefined}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabPill({ active, onClick, label, count, icon }: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all shrink-0",
        "outline-none focus-visible:outline-none",
        "shadow-none",
        active
          ? [
              "bg-violet-700 text-white",
              "dark:bg-violet-600 dark:text-white",
            ].join(" ")
          : [
              "bg-white text-violet-800 hover:bg-violet-50 active:bg-violet-100",
              "dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15 dark:active:bg-white/20",
            ].join(" ")
      )}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={cn(
          "ml-1 text-[11px] opacity-70",
          active ? "text-white/95" : "text-violet-500/80 dark:text-white/50"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function CircleRow({ circle, isJoined, onJoin, joinLoading }: {
  circle: Circle;
  isJoined: boolean;
  onJoin: (slug: string) => void;
  joinLoading: boolean;
}) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-violet-100/70 active:bg-violet-100 dark:hover:bg-white/[0.03] dark:active:bg-white/[0.05]">
      <Link href={`/circles/${encodeURIComponent(circle.slug)}`} className="shrink-0">
        <CircleAvatar
          name={circle.name}
          imageUrl={circle.circle_image_url ?? null}
          size="sm"
          className="h-11 w-11 rounded-full object-cover ring-1 ring-violet-200/70 dark:ring-white/10"
        />
      </Link>

      <Link href={`/circles/${encodeURIComponent(circle.slug)}`} className="flex-1 min-w-0">
        <h3 className="text-[13px] font-semibold text-violet-950 dark:text-white/95 truncate leading-snug">
          {circle.name}
        </h3>
        <p className="mt-0.5 text-[12px] text-violet-700/80 dark:text-white/55 truncate leading-snug">
          {circle.description || "Join the conversation"}
        </p>
        <div className="mt-1 flex items-center gap-1 text-violet-700/60 dark:text-white/35">
          <Users className="h-3 w-3" />
          <span className="text-[10px] font-medium">
            {formatMemberCount(circle.member_count)}
          </span>
        </div>
      </Link>

      <div className="shrink-0 flex items-center gap-3">
        {isJoined ? (
          <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700 dark:bg-white/5 dark:text-white/60">
            Joined
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              onJoin(circle.slug);
            }}
            disabled={joinLoading}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
              "bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500 dark:hover:text-white dark:active:bg-violet-400"
            )}
          >
            {joinLoading ? "..." : "Join"}
          </button>
        )}
        <ChevronRight className="h-4 w-4 text-violet-300 group-hover:text-violet-500 transition-colors dark:text-white/10 dark:group-hover:text-white/30" />
      </div>
    </div>
  );
}

function ExploreCircleRow({
  circle,
  isJoined,
  onJoin,
  joinLoading,
  rank,
}: {
  circle: Circle;
  isJoined: boolean;
  onJoin: (slug: string) => void;
  joinLoading: boolean;
  rank?: number;
}) {
  const rankColors =
    rank === undefined
      ? "bg-white/5 text-white/60"
      : rank === 1
      ? "bg-amber-400 text-black"
      : rank === 2
      ? "bg-slate-200 text-slate-900"
      : rank === 3
      ? "bg-amber-600 text-white"
      : "bg-white/5 text-white/70";

  return (
    <div className="group flex items-center gap-3 px-1 py-3 transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]">
      <div className="flex items-center gap-2">
        {rank !== undefined && rank <= 10 && (
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold",
              rankColors
            )}
          >
            #{rank}
          </span>
        )}
        <Link href={`/circles/${encodeURIComponent(circle.slug)}`} className="shrink-0">
          <CircleAvatar
            name={circle.name}
            imageUrl={circle.circle_image_url ?? null}
            size="sm"
            className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
          />
        </Link>
      </div>

      <Link
        href={`/circles/${encodeURIComponent(circle.slug)}`}
        className="flex-1 min-w-0"
      >
        <h3 className="text-[13px] font-semibold text-white/95 truncate leading-snug">
          {circle.name}
        </h3>
        <p className="mt-0.5 text-[12px] text-white/55 truncate leading-snug">
          {circle.description || "Join the conversation"}
        </p>
        <div className="mt-1 flex items-center gap-1 text-white/35">
          <Users className="h-3 w-3" />
          <span className="text-[10px] font-medium">
            {formatMemberCount(circle.member_count)}
          </span>
        </div>
      </Link>

      <div className="shrink-0 flex items-center gap-3">
        {isJoined ? (
          <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/5 text-white/60">
            Joined
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              onJoin(circle.slug);
            }}
            disabled={joinLoading}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
              "bg-violet-500 text-white hover:bg-violet-400 active:bg-violet-600"
            )}
          >
            {joinLoading ? "..." : "Join"}
          </button>
        )}
        <ChevronRight className="h-4 w-4 text-white/15 group-hover:text-white/35 transition-colors" />
      </div>
    </div>
  );
}

function ChatRow({ circle }: { circle: Circle }) {
  return (
    <Link
      href={`/circles/${encodeURIComponent(circle.slug)}`}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-violet-100/70 active:bg-violet-100 dark:hover:bg-white/[0.03] dark:active:bg-white/[0.05]"
    >
      <div className="shrink-0">
        <CircleAvatar
          name={circle.name}
          imageUrl={circle.circle_image_url ?? null}
          size="sm"
          className="h-9 w-9 rounded-full object-cover ring-1 ring-violet-200/70 dark:ring-white/10"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-violet-950 dark:text-white truncate leading-snug">
            {circle.name}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 text-white px-2 py-0.5 text-[10px] font-semibold">
            <MessageCircle className="h-3 w-3" />
            Chat
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-violet-700/80 dark:text-white/55 truncate leading-snug">
          Active conversations with {formatMemberCount(circle.member_count)} members.
        </p>
      </div>
    </Link>
  );
}
