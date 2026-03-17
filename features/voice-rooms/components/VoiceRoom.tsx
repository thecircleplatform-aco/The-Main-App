"use client";

import * as React from "react";
import { useVoiceRoom } from "../hooks/useVoiceRoom";
import type { VoiceSeat } from "../types/voiceRoomTypes";
import { SpeakerGrid } from "./SpeakerGrid";
import { ListenerPanel } from "./ListenerPanel";
import { SeatRequestButton } from "./SeatRequestButton";
import { RoomControls } from "./RoomControls";
import { cn } from "@/lib/utils";

type VoiceRoomProps = {
  circleSlugOrId: string;
  circleName: string;
  currentUserId?: string | null;
  className?: string;
};

export function VoiceRoom({ circleSlugOrId, circleName, currentUserId, className }: VoiceRoomProps) {
  const { state, loading, error, joinAsListener, leave, requestToSpeak, toggleMicrophone } =
    useVoiceRoom({ circleSlugOrId });

  React.useEffect(() => {
    if (state.room) {
      void joinAsListener();
    }
  }, [state.room, joinAsListener]);

  if (loading && !state.room) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!state.room) return null;

  return (
    <section
      className={cn(
        "rounded-2xl border border-violet-200/70 dark:border-violet-500/30 bg-violet-50/60 dark:bg-violet-950/40 p-4 flex flex-col gap-3",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-violet-500 dark:text-violet-300 font-semibold">
            Live Voice Room
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mt-0.5">
            {state.room.topic}
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-white/60">
            In {circleName} · {state.listenerCount} listening
          </p>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <SpeakerGrid
            seats={state.seats}
            maxSeats={state.room.maxSpeakers}
            currentUserId={currentUserId}
          />
        </div>
        <div className="w-full sm:w-56">
          <ListenerPanel listeners={state.listeners} listenerCount={state.listenerCount} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <SeatRequestButton status={state.requestStatus} onRequest={requestToSpeak} />
        <RoomControls
          isSpeaker={state.isSpeaker}
          micEnabled={state.seats.some(
            (s: VoiceSeat) => s.userId === currentUserId && s.micEnabled
          )}
          onToggleMic={toggleMicrophone}
          onLeave={leave}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1" role="status">
          {error}
        </p>
      )}
    </section>
  );
}

