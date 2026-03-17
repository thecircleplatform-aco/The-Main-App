export type VoiceRoomStatus = "scheduled" | "live" | "ended";

export type VoiceRoomSummary = {
  id: string;
  circleId: string;
  topic: string;
  hostUserId: string;
  maxSpeakers: number;
  status: VoiceRoomStatus;
  startedAt: string;
  endedAt: string | null;
};

export type VoiceSeat = {
  userId: string;
  username: string | null;
  seatNumber: number;
  micEnabled: boolean;
  isHost: boolean;
};

export type VoiceListener = {
  userId: string;
  username: string | null;
};

export type VoiceRoomState = {
  room: VoiceRoomSummary | null;
  seats: VoiceSeat[];
  listeners: VoiceListener[];
  listenerCount: number;
  isHost: boolean;
  isSpeaker: boolean;
  isListener: boolean;
  requestStatus: "idle" | "pending" | "accepted" | "rejected";
};

