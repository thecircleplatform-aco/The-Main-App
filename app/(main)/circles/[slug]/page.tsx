"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Megaphone,
  Shield,
  Menu,
  MoreVertical,
} from "lucide-react";
import {
  CircleChatWindow,
  type ChatMessage,
} from "@/components/circles/CircleChatWindow";
import {
  CircleChannelsSidebar,
  type ChannelItem,
} from "@/components/circles/CircleChannelsSidebar";
import { CircleMemberCard } from "@/components/circles/CircleMemberCard";
import { cn } from "@/lib/utils";
import { CircleAvatar } from "@/components/circles/CircleAvatar";

type CircleUpdate = {
  id: string;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
};

type CircleMember = {
  user_id: string;
  username: string;
  role: "member" | "moderator" | "admin" | string;
  joined_at: string;
};

type CircleData = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  member_count: number;
  channels: string[];
  channelList: ChannelItem[];
  circle_image_url?: string | null;
};

export default function CircleChatPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params?.slug ?? null;
  const [circle, setCircle] = React.useState<CircleData | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [hasOlder, setHasOlder] = React.useState(false);
  const [activeChannel, setActiveChannel] = React.useState<string>("general");
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [sendLoading, setSendLoading] = React.useState(false);
  const [loadOlderLoading, setLoadOlderLoading] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [mainTab, setMainTab] = React.useState<"chat" | "updates" | "members">(
    "chat"
  );
  const [updates, setUpdates] = React.useState<CircleUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [updateNotification, setUpdateNotification] = React.useState<
    string | null
  >(null);
  const [members, setMembers] = React.useState<CircleMember[]>([]);
  const [membersLoading, setMembersLoading] = React.useState(false);
  const [membersError, setMembersError] = React.useState<string | null>(null);
  const [membersCursor, setMembersCursor] = React.useState<string | null>(null);
  const [membersSearch, setMembersSearch] = React.useState("");
  const [membersSearchApplied, setMembersSearchApplied] = React.useState("");
  const [membersLoadingMore, setMembersLoadingMore] = React.useState(false);
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const updateStreamRef = React.useRef<EventSource | null>(null);
  const [quickMenuOpen, setQuickMenuOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);

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
        const chList = data.channelList ?? [];
        const slugs = chList.map((c) => c.slug);
        if (slugs.length > 0 && !slugs.includes(activeChannel)) {
          setActiveChannel(slugs[0]);
        }
      })
      .catch((e) => setLoadError(e?.message ?? "Failed to load circle"))
      .finally(() => setLoading(false));
  }, [slug]);

  React.useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }, []);

  React.useEffect(() => {
    if (!slug) return;
    fetch(`/api/circles/${encodeURIComponent(slug)}/role`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUserRole(data?.role ?? null))
      .catch(() => setUserRole(null));
  }, [slug]);

  React.useEffect(() => {
    if (!slug || mainTab !== "updates") return;
    setUpdatesLoading(true);
    fetch(`/api/circle-updates/list?circleSlug=${encodeURIComponent(slug)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : { updates: [] }))
      .then((data) => setUpdates(data.updates ?? []))
      .catch(() => setUpdates([]))
      .finally(() => setUpdatesLoading(false));
  }, [slug, mainTab]);

  React.useEffect(() => {
    if (!slug || mainTab !== "members") return;
    const controller = new AbortController();
    const load = async () => {
      setMembersLoading(true);
      setMembersError(null);
      try {
        const params = new URLSearchParams();
        params.set("circleSlug", slug);
        params.set("limit", "50");
        if (membersSearchApplied) params.set("search", membersSearchApplied);
        const res = await fetch(
          `/api/circle-members/list?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMembersError(data?.error ?? "Failed to load members");
          setMembers([]);
          setMembersCursor(null);
          return;
        }
        setMembers(data.members ?? []);
        setMembersCursor(data.nextCursor ?? null);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setMembersError("Failed to load members");
        }
      } finally {
        setMembersLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [slug, mainTab, membersSearchApplied]);

  React.useEffect(() => {
    if (!slug) return;
    const url = `/api/circle-updates/stream?circleSlug=${encodeURIComponent(
      slug
    )}`;
    const es = new EventSource(url);
    updateStreamRef.current = es;
    es.addEventListener("new_update", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string);
        setUpdateNotification(data?.message ?? "New update in this circle.");
      } catch (_) {}
    });
    es.addEventListener("error", () => es.close());
    return () => {
      es.close();
      updateStreamRef.current = null;
    };
  }, [slug]);

  React.useEffect(() => {
    if (!slug || !circle || !activeChannel || mainTab !== "chat") return;
    const channelList = circle.channelList ?? [];
    if (!channelList.some((c) => c.slug === activeChannel)) return;

    const url = `/api/circle-messages/stream?circleSlug=${encodeURIComponent(
      slug
    )}&channel=${encodeURIComponent(activeChannel)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("history", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string);
        const list = Array.isArray(data?.messages) ? data.messages : [];
        setMessages(
          list.map(
            (m: {
              id: string;
              username: string;
              message_text: string;
              created_at: string;
              user_id?: string;
            }) => ({
              id: m.id,
              username: m.username,
              message_text: m.message_text,
              created_at: m.created_at,
              user_id: m.user_id,
            })
          )
        );
        setHasOlder(list.length >= 50);
      } catch (_) {}
    });

    es.addEventListener("message", (e: MessageEvent) => {
      try {
        const m = JSON.parse(e.data as string);
        if (!m?.id) return;
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          return [
            ...prev,
            {
              id: m.id,
              username: m.username,
              message_text: m.message_text,
              created_at: m.created_at,
              user_id: m.user_id,
            },
          ];
        });
      } catch (_) {}
    });

    es.addEventListener("error", () => {
      es.close();
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [slug, circle?.id, activeChannel, mainTab]);

  const handleSend = React.useCallback(
    async (text: string) => {
      if (!slug || !activeChannel) return;
      setSendError(null);
      setSendLoading(true);
      try {
        const res = await fetch("/api/circle-messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            circleSlug: slug,
            channel: activeChannel,
            message: text,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSendError(data?.error ?? "Failed to send");
          return;
        }
        if (data?.message) {
          setMessages((prev) => {
            if (prev.some((x) => x.id === data.message.id)) return prev;
            return [
              ...prev,
              {
                id: data.message.id,
                username: data.message.username,
                message_text: data.message.message_text,
                created_at: data.message.created_at,
                user_id: currentUserId ?? undefined,
              },
            ];
          });
        }
      } finally {
        setSendLoading(false);
      }
    },
    [slug, activeChannel, currentUserId]
  );

  const handleChannelSelect = React.useCallback((ch: string) => {
    setActiveChannel(ch);
    setMessages([]);
    setHasOlder(false);
    setNavOpen(false);
  }, []);

  const handleLoadOlder = React.useCallback(async () => {
    if (
      !slug ||
      !activeChannel ||
      messages.length === 0 ||
      loadOlderLoading
    )
      return;
    const firstId = messages[0]?.id;
    if (!firstId) return;
    setLoadOlderLoading(true);
    try {
      const res = await fetch(
        `/api/circle-messages/history?circleSlug=${encodeURIComponent(
          slug
        )}&channel=${encodeURIComponent(activeChannel)}&before=${encodeURIComponent(
          firstId
        )}`,
        { credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.messages)) {
        const older = data.messages.map((m: ChatMessage) => ({
          id: m.id,
          username: m.username,
          message_text: m.message_text,
          created_at: m.created_at,
          user_id: m.user_id,
        }));
        setMessages((prev) => [...[...older].reverse(), ...prev]);
        setHasOlder(Boolean(data.hasMore));
      }
    } finally {
      setLoadOlderLoading(false);
    }
  }, [slug, activeChannel, messages, loadOlderLoading]);

  const handleLoadMoreMembers = React.useCallback(async () => {
    if (!slug || !membersCursor || membersLoadingMore) return;
    setMembersLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("circleSlug", slug);
      params.set("limit", "50");
      params.set("cursor", membersCursor);
      if (membersSearchApplied) params.set("search", membersSearchApplied);
      const res = await fetch(`/api/circle-members/list?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.members)) {
        setMembers((prev) => [...prev, ...data.members]);
        setMembersCursor(data.nextCursor ?? null);
      }
    } finally {
      setMembersLoadingMore(false);
    }
  }, [slug, membersCursor, membersLoadingMore, membersSearchApplied]);

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

  const channelList = circle.channelList ?? [];
  if (channelList.length === 0) {
    return (
      <div
        className="min-h-dvh bg-gray-50/80 dark:bg-black/80 flex flex-col items-center justify-center p-6"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
          No channels in this circle yet.
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
      className={cn(
        "h-dvh w-full bg-gray-50/80 dark:bg-black/80 flex flex-col overflow-hidden",
        "md:max-w-6xl md:mx-auto"
      )}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/70 dark:border-white/10 dark:bg-black/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            aria-label="Open circle navigation"
            aria-pressed={navOpen}
            onClick={() => setNavOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/60 bg-white/60 text-gray-700 shadow-sm transition-all duration-150 ease-out hover:bg-white/75 hover:border-gray-300/80 active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link
            href={`/circles/${encodeURIComponent(slug!)}/about`}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <CircleAvatar
              name={circle.name}
              imageUrl={circle.circle_image_url ?? null}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {circle.name}
              </h1>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500 dark:text-white/60">
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                    aria-hidden
                  />
                  <span>
                    {circle.member_count}{" "}
                    {circle.member_count === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() =>
              setMainTab((prev) => (prev === "members" ? "chat" : "members"))
            }
            aria-label="Open members list"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/60 bg-white/60 text-gray-700 shadow-sm transition-all duration-150 ease-out hover:bg-white/75 hover:border-gray-300/80 active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
          >
            <Users className="h-4 w-4" />
          </button>
          {(userRole === "admin" || userRole === "moderator") && (
            <Link
              href={`/circles/${encodeURIComponent(slug!)}/admin`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10"
              aria-label="Circle admin"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
          <div className="relative">
            <button
              type="button"
              aria-label="Open quick actions"
              onClick={() => setQuickMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/60 bg-white/60 text-gray-700 shadow-sm transition-all duration-150 ease-out hover:bg-white/75 hover:border-gray-300/80 active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {quickMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200/80 bg-white/95 text-gray-900 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-black/90 dark:text-white text-xs z-30">
                <ul className="py-1">
                  <li>
                    <Link
                      href={`/circles/${encodeURIComponent(slug!)}/about`}
                      className="block px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/10"
                      onClick={() => setQuickMenuOpen(false)}
                    >
                      Circle info
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      Report message
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg.white/10"
                    >
                      Mute notifications
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      Leave circle
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      Share circle
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {sendError && (
        <div className="mx-4 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {sendError}
        </div>
      )}

      {updateNotification && (
        <div className="mx-4 mt-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200 flex items-center justify-between gap-2">
          <span>{updateNotification}</span>
          <button
            type="button"
            onClick={() => setUpdateNotification(null)}
            className="shrink-0 text-violet-600 dark:text-violet-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0 relative">
        {mainTab === "chat" && (
          <>
            <CircleChatWindow
              messages={messages}
              currentUserId={currentUserId}
              onSend={handleSend}
              sendLoading={sendLoading}
              onLoadOlder={handleLoadOlder}
              hasOlder={hasOlder}
              loadOlderLoading={loadOlderLoading}
              emptyMessage="No messages yet. Say hello!"
              fullPage
            />
            {navOpen && (
              <div className="absolute inset-0 z-30 flex">
                <div className="h-full w-64 max-w-[75%] bg-white/95 dark:bg-black/95 border-r border-gray-200/80 dark:border-white/10 shadow-lg">
                  <CircleChannelsSidebar
                    channels={channelList}
                    activeChannel={activeChannel}
                    onSelectChannel={handleChannelSelect}
                    className="h-full"
                  />
                </div>
                <button
                  type="button"
                  aria-label="Close navigation"
                  className="flex-1 bg-black/30 sm:bg-transparent sm:pointer-events-none"
                  onClick={() => setNavOpen(false)}
                />
              </div>
            )}
          </>
        )}
        {mainTab === "updates" && (
          <div className="flex-1 min-w-0 overflow-y-auto">
            {updatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : updates.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-white/50 py-8 text-center">
                No updates yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {updates.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {u.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-white/70 whitespace-pre-wrap">
                      {u.content}
                    </p>
                    <p className="mt-2 text-xs text-gray-400 dark:text-white/40">
                      {u.author_name} ·{" "}
                      {new Date(u.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {mainTab === "members" && (
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="mb-3 flex items-center gap-2">
              <input
                type="text"
                value={membersSearch}
                onChange={(e) => setMembersSearch(e.target.value)}
                placeholder="Search members by name"
                className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/40 px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
              />
              <button
                type="button"
                onClick={() => setMembersSearchApplied(membersSearch.trim())}
                className="rounded-lg bg-gray-900 text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm font-medium"
              >
                Search
              </button>
            </div>
            {membersLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : membersError ? (
              <div className="text-sm text-red-600 dark:text-red-400 py-4">
                {membersError}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-white/50 py-8 text-center">
                No members found.
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li key={m.user_id}>
                      <CircleMemberCard
                        username={m.username}
                        role={m.role}
                        joined_at={m.joined_at}
                      />
                    </li>
                  ))}
                </ul>
                {membersCursor && (
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={handleLoadMoreMembers}
                      disabled={membersLoadingMore}
                      className="rounded-full px-4 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/20 hover:bg-violet-200 dark:hover:bg-violet-500/30 disabled:opacity-50"
                    >
                      {membersLoadingMore ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile bottom channel / status bar removed; channel chips should live on the circles about page instead. */}
    </div>
  );
}

