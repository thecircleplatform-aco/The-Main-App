export type VoiceRoomUserJoinPayload = {
  roomId: string;
  userId: string;
  username: string | null;
  as: "speaker" | "listener";
};

export type VoiceRoomSeatUpdatePayload = {
  roomId: string;
  seats: {
    userId: string;
    username: string | null;
    seatNumber: number;
    micEnabled: boolean;
    isHost: boolean;
  }[];
};

export type VoiceRoomMicStatusPayload = {
  roomId: string;
  userId: string;
  micEnabled: boolean;
};

export type VoiceRoomListenerCountPayload = {
  roomId: string;
  listenerCount: number;
};

export type VoiceRoomRequestPayload = {
  roomId: string;
  userId: string;
  username: string | null;
  status: "pending" | "accepted" | "rejected";
};

export type VoiceRoomEvent =
  | { type: "user_joined_room"; data: VoiceRoomUserJoinPayload }
  | { type: "user_left_room"; data: VoiceRoomUserJoinPayload }
  | { type: "seat_assigned"; data: VoiceRoomSeatUpdatePayload }
  | { type: "seat_removed"; data: VoiceRoomSeatUpdatePayload }
  | { type: "mic_muted"; data: VoiceRoomMicStatusPayload }
  | { type: "mic_unmuted"; data: VoiceRoomMicStatusPayload }
  | { type: "listener_count_updated"; data: VoiceRoomListenerCountPayload }
  | { type: "seat_request_updated"; data: VoiceRoomRequestPayload };

type Listener = (event: VoiceRoomEvent) => void;

const listeners = new Map<string, Set<Listener>>();

function roomKey(roomId: string): string {
  return roomId;
}

export function subscribeVoiceRoom(roomId: string, listener: Listener): () => void {
  const key = roomKey(roomId);
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  return () => {
    const set = listeners.get(key);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      listeners.delete(key);
    }
  };
}

export function broadcastVoiceRoom(roomId: string, event: VoiceRoomEvent): void {
  const key = roomKey(roomId);
  const set = listeners.get(key);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(event);
    } catch {
      // ignore listener errors
    }
  }
}

