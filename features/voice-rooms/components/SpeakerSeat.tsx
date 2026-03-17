"use client";

import * as React from "react";
import { Mic, MicOff, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceSeat } from "../types/voiceRoomTypes";

type SpeakerSeatProps = {
  seat?: VoiceSeat;
  isOwn?: boolean;
};

export function SpeakerSeat({ seat, isOwn }: SpeakerSeatProps) {
  if (!seat) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300/70 dark:border-white/15 bg-white/40 dark:bg-white/5 min-h-[96px] px-3 py-3 text-xs text-gray-400">
        Open Seat
      </div>
    );
  }

  const initials = (seat.username ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border bg-white/60 dark:bg-white/5 min-h-[96px] px-3 py-3",
        "border-gray-200 dark:border-white/10",
        isOwn && "ring-2 ring-violet-500/70"
      )}
    >
      <div className="relative mb-2">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center text-sm font-semibold shadow-md">
          {initials}
        </div>
        {seat.isHost && (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-400 text-amber-950 p-0.5 shadow">
            <Crown className="h-3 w-3" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-900 dark:text-white max-w-[80px] truncate">
          {seat.username ?? "Someone"}
        </span>
        {seat.micEnabled ? (
          <Mic className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <MicOff className="h-3.5 w-3.5 text-gray-400" />
        )}
      </div>
      {isOwn && (
        <span className="mt-1 text-[10px] text-violet-600 dark:text-violet-300 rounded-full bg-violet-50 dark:bg-violet-500/15 px-2 py-0.5">
          You
        </span>
      )}
    </div>
  );
}

