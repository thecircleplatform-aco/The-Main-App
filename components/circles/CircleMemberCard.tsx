"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type CircleMemberCardProps = {
  username: string;
  role: "member" | "moderator" | "admin" | string;
  joined_at: string;
};

function formatJoined(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (Number.isNaN(diffDays)) return "Joined recently";
    if (diffDays <= 0) return "Joined today";
    if (diffDays === 1) return "Joined yesterday";
    if (diffDays < 30) return `Joined ${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "Joined 1 month ago";
    if (diffMonths < 12) return `Joined ${diffMonths} months ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1
      ? "Joined 1 year ago"
      : `Joined ${diffYears} years ago`;
  } catch {
    return "Joined recently";
  }
}

function roleLabel(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "moderator") return "Moderator";
  return "Member";
}

export function CircleMemberCard({
  username,
  role,
  joined_at,
}: CircleMemberCardProps) {
  const label = roleLabel(role);
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2.5">
      <div className="min-w-0">
        <Link
          href={`/users/${encodeURIComponent(username)}`}
          className="text-sm font-medium text-gray-900 dark:text-white truncate hover:underline"
        >
          {username}
        </Link>
        <p className="text-xs text-gray-500 dark:text-white/60">
          {formatJoined(joined_at)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
          isAdmin
            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
            : isModerator
            ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200"
            : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70"
        )}
      >
        {label}
      </span>
    </div>
  );
}

