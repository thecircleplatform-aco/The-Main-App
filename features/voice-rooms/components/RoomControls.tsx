"use client";

import * as React from "react";
import { PhoneOff, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

type RoomControlsProps = {
  isSpeaker: boolean;
  micEnabled: boolean;
  onToggleMic: (enable: boolean) => void;
  onLeave: () => void;
};

export function RoomControls({ isSpeaker, micEnabled, onToggleMic, onLeave }: RoomControlsProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onLeave}
        className="inline-flex items-center gap-1.5 rounded-full bg-red-500 text-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-red-600"
      >
        <PhoneOff className="h-3.5 w-3.5" />
        Leave Room
      </button>
      {isSpeaker && (
        <button
          type="button"
          onClick={() => onToggleMic(!micEnabled)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
            micEnabled
              ? "bg-emerald-500 text-white hover:bg-emerald-600"
              : "bg-gray-700 text-white hover:bg-gray-800"
          )}
        >
          {micEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          {micEnabled ? "Mute" : "Unmute"}
        </button>
      )}
    </div>
  );
}

