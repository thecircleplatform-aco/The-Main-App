"use client";

import * as React from "react";
import type { VoiceListener } from "../types/voiceRoomTypes";
import { Users } from "lucide-react";

type ListenerPanelProps = {
  listeners: VoiceListener[];
  listenerCount: number;
};

export function ListenerPanel({ listeners, listenerCount }: ListenerPanelProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 min-h-[140px]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-white/80">
          <Users className="h-3.5 w-3.5" />
          Listeners
        </div>
        <span className="text-xs text-gray-500 dark:text-white/50">{listenerCount}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {listeners.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-white/50">No listeners yet.</p>
        ) : (
          listeners.map((l) => (
            <div
              key={l.userId}
              className="text-xs text-gray-800 dark:text-white/80 rounded-lg bg-gray-50/70 dark:bg-black/30 px-2 py-1"
            >
              {l.username ?? "Listener"}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

