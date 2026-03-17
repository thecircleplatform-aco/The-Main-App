"use client";

import * as React from "react";
import type { VoiceSeat } from "../types/voiceRoomTypes";
import { SpeakerSeat } from "./SpeakerSeat";

type SpeakerGridProps = {
  seats: VoiceSeat[];
  maxSeats: number;
  currentUserId?: string | null;
};

export function SpeakerGrid({ seats, maxSeats, currentUserId }: SpeakerGridProps) {
  const filledSeats: (VoiceSeat | undefined)[] = [];
  for (let i = 1; i <= maxSeats; i++) {
    const existing = seats.find((s) => s.seatNumber === i);
    filledSeats.push(existing);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {filledSeats.map((seat, idx) => (
        <SpeakerSeat key={idx} seat={seat} isOwn={seat?.userId === currentUserId} />
      ))}
    </div>
  );
}

