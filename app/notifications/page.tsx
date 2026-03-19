"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  circle_id: string | null;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

type ListResponse = {
  notifications: NotificationItem[];
  nextCursor: string | null;
};

export default function NotificationsPage() {
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filterUnread, setFilterUnread] = React.useState(false);

  const load = React.useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      const append = opts?.append ?? false;
      const cur = opts?.cursor ?? null;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        if (cur) params.set("cursor", cur);
        if (filterUnread) params.set("unreadOnly", "true");
        const res = await fetch(`/api/notifications/list?${params.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json().catch(() => ({}))) as Partial<ListResponse>;
        if (!res.ok) {
          setError(
            (data as any)?.error ?? "Failed to load notifications"
          );
          if (!append) {
            setItems([]);
            setCursor(null);
          }
          return;
        }
        const newItems = data.notifications ?? [];
        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setCursor(data.nextCursor ?? null);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [filterUnread]
  );

  React.useEffect(() => {
    load();
  }, [load]);

  const handleToggleFilter = () => {
    setFilterUnread((prev) => !prev);
    // Reload from first page when filter changes
    load({ append: false, cursor: null });
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const handleItemClick = async (n: NotificationItem) => {
    if (!n.is_read) {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ notificationId: n.id }),
        });
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      } catch {
        // ignore
      }
    }
    if (n.circle_id) {
      // For now, navigate to circles list; slug resolution can be added later.
      window.location.href = "/circles";
    }
  };

  return (
    <div
      className="min-h-dvh bg-gray-50/80 dark:bg-black/80 text-gray-900 dark:text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">Notifications</h1>
            <p className="text-xs text-gray-500 dark:text-white/60">
              Activity from circles and admins.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleFilter}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
          >
            {filterUnread ? "Showing unread" : "Showing all"}
          </button>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
          >
            Mark all read
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-white/60">
            No notifications yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={cn(
                  "cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors",
                  n.is_read
                    ? "border-gray-200 bg-white/70 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
                    : "border-violet-200 bg-violet-50 text-gray-900 dark:border-violet-500/40 dark:bg-violet-500/15"
                )}
              >
                <p
                  className={cn(
                    "truncate",
                    !n.is_read && "font-semibold"
                  )}
                >
                  {n.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 dark:text-white/60">
                  {n.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        {cursor && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => load({ append: true, cursor })}
              disabled={loadingMore}
              className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

