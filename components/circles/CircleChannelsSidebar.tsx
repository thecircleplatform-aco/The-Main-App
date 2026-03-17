"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, CircleDollarSign } from "lucide-react";

export type ChannelItem = { slug: string; name: string };

export type CircleChannelsSidebarProps = {
  channels: ChannelItem[];
  activeChannel: string;
  onSelectChannel: (slug: string) => void;
  className?: string;
};

export function CircleChannelsSidebar({
  channels,
  activeChannel,
  onSelectChannel,
  className,
}: CircleChannelsSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 min-w-[180px]",
        className
      )}
    >
      <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
        Circle
      </h3>
      <div className="px-3 pb-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Home
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {channels.map((ch) => (
          <button
            key={ch.slug}
            type="button"
            onClick={() => onSelectChannel(ch.slug)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition",
              activeChannel === ch.slug
                ? "bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-violet-200"
                : "text-gray-700 hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/10"
            )}
          >
            <CircleDollarSign className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{ch.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
