"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CircleMember = {
  user_id: string;
  role: string;
  joined_at: string;
  name?: string;
  email: string;
};

export type MemberManagementProps = {
  circleSlug: string;
  currentUserId: string;
  className?: string;
};

export function MemberManagement({
  circleSlug,
  currentUserId,
  className,
}: MemberManagementProps) {
  const [members, setMembers] = React.useState<CircleMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/circle-members/admin-list?circleSlug=${encodeURIComponent(circleSlug)}`, {
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load members");
        return r.json();
      })
      .then((data) => setMembers(data.members ?? []))
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [circleSlug]);

  React.useEffect(() => load(), [load]);

  const handleBan = async (userId: string) => {
    if (!confirm("Ban this user from the circle? They will be removed and cannot rejoin.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch("/api/circle-members/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ circleSlug, userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to ban");
        return;
      }
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (userId: string, role: "member" | "moderator" | "admin") => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/circle-members/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ circleSlug, userId, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to update role");
        return;
      }
      load();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4", className)}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Members
        </h3>
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4", className)}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Members
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Members ({members.length})
      </h3>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {members.map((m) => (
          <li
            key={m.user_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-white/5 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {m.name || m.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-white/50 truncate">
                {m.role} · {m.email}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <select
                value={m.role}
                onChange={(e) =>
                  handlePromote(m.user_id, e.target.value as "member" | "moderator" | "admin")
                }
                disabled={m.user_id === currentUserId || actionLoading === m.user_id}
                className="rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-xs text-gray-900 dark:text-white py-1 px-2"
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              {m.user_id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => handleBan(m.user_id)}
                  disabled={!!actionLoading}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                >
                  Ban
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
