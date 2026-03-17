"use client";

import * as React from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleAvatar } from "./CircleAvatar";

export type CircleCardProps = {
  name: string;
  slug: string;
  category: string;
  description: string;
  member_count: number;
  circle_image_url?: string | null;
  isJoined?: boolean;
  onJoin?: (slug: string) => void;
  joinLoading?: boolean;
};

function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function CircleCard({
  name,
  slug,
  category,
  description,
  member_count,
  circle_image_url,
  isJoined,
  onJoin,
  joinLoading,
}: CircleCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur-xl transition-all duration-200",
        "hover:border-violet-200 hover:shadow-md hover:shadow-violet-500/10 dark:shadow-none",
        "dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/[0.07]"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-center gap-3">
          <CircleAvatar name={name} imageUrl={circle_image_url ?? null} size="sm" />
          <div className="flex flex-1 flex-col min-w-0">
            <h3 className="mb-0.5 truncate text-base font-semibold text-gray-900 dark:text-white/90">
              <Link
                href={`/circles/${encodeURIComponent(slug)}`}
                className="hover:underline focus:underline"
              >
                {name}
              </Link>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
            )}
          >
            {category}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
              "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60"
            )}
          >
            <Users className="h-3 w-3" aria-hidden />
            {formatMemberCount(member_count)}
          </span>
            </div>
          </div>
        </div>
        <p className="line-clamp-2 min-h-[2.5rem] text-xs text-gray-600 dark:text-white/55">
          {description || "Join the conversation."}
        </p>
      </div>
      <div className="mt-4 flex shrink-0">
        {onJoin && (
          <Button
            variant={isJoined ? "ghost" : "primary"}
            size="md"
            className={cn(
              "w-full min-w-[100px]",
              isJoined &&
                "cursor-default text-emerald-600 dark:text-emerald-400"
            )}
            disabled={joinLoading}
            onClick={() => onJoin(slug)}
          >
            {joinLoading ? "…" : isJoined ? "Joined" : "Join Circle"}
          </Button>
        )}
      </div>
    </article>
  );
}
