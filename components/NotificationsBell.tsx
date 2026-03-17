"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  circle_id: string | null;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  nextCursor: string | null;
};

export function NotificationsBell() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  const loadLatest = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/list?limit=10", {
        credentials: "include",
      });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = (await res.json()) as NotificationsResponse;
      setItems(data.notifications ?? []);
      setUnreadCount((data.notifications ?? []).filter((n) => !n.is_read).length);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Prefetch unread count with a tiny call (reuse list endpoint).
    loadLatest().catch(() => {});
  }, [loadLatest]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && items.length === 0) {
      loadLatest().catch(() => {});
    }
  };

  const handleMarkRead = async (id: string, circleId: string | null) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notificationId: id }),
      });
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (circleId) {
        // Navigate to circle page; slug will be resolved server-side if needed.
        window.location.href = "/circles";
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.2rem] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200/80 bg-white/95 text-gray-900 shadow-lg dark:border-white/10 dark:bg-black/95 dark:text-white z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/10">
            <span className="text-xs font-semibold uppercase tracking-wide">
              Notifications
            </span>
            <Link
              href="/notifications"
              className="text-xs text-violet-600 hover:underline dark:text-violet-400"
            >
              View all
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-gray-500 dark:text-white/60">
                You have no notifications yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/10">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5",
                      !n.is_read && "font-semibold"
                    )}
                    onClick={() => handleMarkRead(n.id, n.circle_id)}
                  >
                    <p className="truncate">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] font-normal text-gray-500 dark:text-white/60">
                      {n.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

