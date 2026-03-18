"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type UserProfileCardProps = {
  username: string;
  joinedCircles: number;
  messagesSent: number;
  joinedAt: string;
  avatarUrl?: string | null;
};

function formatJoined(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export function UserProfileCard({
  username,
  joinedCircles,
  messagesSent,
  joinedAt,
  avatarUrl,
}: UserProfileCardProps) {
  const initial = username?.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-white flex items-center justify-center text-lg font-semibold overflow-hidden">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
          {username}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-white/60">
          Joined {formatJoined(joinedAt)}
        </p>
        <div className="mt-1 flex gap-4 text-xs text-gray-600 dark:text-white/70">
          <span>
            <span className="font-semibold">{joinedCircles}</span> joined{" "}
            {joinedCircles === 1 ? "circle" : "circles"}
          </span>
          <span>
            <span className="font-semibold">{messagesSent}</span> messages sent
          </span>
        </div>
      </div>
    </div>
  );
}

