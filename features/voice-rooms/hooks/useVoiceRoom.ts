"use client";

import * as React from "react";
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, createLocalAudioTrack } from "livekit-client";
import type { VoiceRoomState } from "../types/voiceRoomTypes";
import { fetchActiveVoiceRoom, joinVoiceRoom, requestSeat, toggleMic } from "../services/voiceRoomClient";

type UseVoiceRoomOptions = {
  circleSlugOrId: string;
};

export function useVoiceRoom({ circleSlugOrId }: UseVoiceRoomOptions) {
  const [state, setState] = React.useState<VoiceRoomState>({
    room: null,
    seats: [],
    listeners: [],
    listenerCount: 0,
    isHost: false,
    isSpeaker: false,
    isListener: false,
    requestStatus: "idle",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const roomRef = React.useRef<Room | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const active = await fetchActiveVoiceRoom(circleSlugOrId);
        if (cancelled) return;
        setState((prev) => ({ ...prev, room: active ?? null }));
      } catch (e) {
        setError("Failed to load voice room");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [circleSlugOrId]);

  const joinAsListener = React.useCallback(async () => {
    if (!state.room) return;
    try {
      const { token, roomName, url } = await joinVoiceRoom(state.room.id);
      const lkRoom = new Room({
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        videoCaptureDefaults: { deviceId: undefined },
      });
      await lkRoom.connect(url, token);
      roomRef.current = lkRoom;
      setState((prev) => ({ ...prev, isListener: true }));

      lkRoom.on(RoomEvent.ParticipantConnected, () => {});
      lkRoom.on(RoomEvent.ParticipantDisconnected, () => {});
    } catch (e) {
      setError("Failed to connect to voice room");
    }
  }, [state.room]);

  const leave = React.useCallback(async () => {
    const r = roomRef.current;
    if (r) {
      r.disconnect();
      roomRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isListener: false,
      isSpeaker: false,
    }));
  }, []);

  const requestToSpeak = React.useCallback(async () => {
    if (!state.room) return;
    try {
      setState((prev) => ({ ...prev, requestStatus: "pending" }));
      await requestSeat(state.room.id);
    } catch {
      setState((prev) => ({ ...prev, requestStatus: "idle" }));
    }
  }, [state.room]);

  const toggleMicrophone = React.useCallback(
    async (enable: boolean) => {
      if (!state.room) return;
      try {
        await toggleMic(state.room.id, enable);
      } catch {
        setError("Failed to toggle microphone");
      }
    },
    [state.room]
  );

  return {
    state,
    loading,
    error,
    joinAsListener,
    leave,
    requestToSpeak,
    toggleMicrophone,
  };
}

