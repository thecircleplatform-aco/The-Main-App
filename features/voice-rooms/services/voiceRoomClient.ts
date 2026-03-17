import type { VoiceRoomSummary } from "../types/voiceRoomTypes";

export async function fetchActiveVoiceRoom(circleSlugOrId: string): Promise<VoiceRoomSummary | null> {
  const res = await fetch(`/api/voice/rooms/active?circle=${encodeURIComponent(circleSlugOrId)}`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.room ?? null;
}

export async function startVoiceRoom(circleSlugOrId: string, topic: string): Promise<VoiceRoomSummary> {
  const res = await fetch("/api/voice/rooms", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ circleId: circleSlugOrId, topic }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.room) {
    throw new Error(data?.error ?? "Failed to start voice room");
  }
  return data.room;
}

export async function endVoiceRoom(roomId: string): Promise<void> {
  await fetch(`/api/voice/rooms/${encodeURIComponent(roomId)}/end`, {
    method: "POST",
    credentials: "include",
  });
}

export async function joinVoiceRoom(roomId: string): Promise<{ token: string; roomName: string; url: string }> {
  const res = await fetch("/api/voice/token", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room_id: roomId }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.token) {
    throw new Error(data?.error ?? "Failed to join room");
  }
  return { token: data.token, roomName: data.roomName, url: data.url };
}

export async function requestSeat(roomId: string): Promise<void> {
  await fetch(`/api/voice/rooms/${encodeURIComponent(roomId)}/request-seat`, {
    method: "POST",
    credentials: "include",
  });
}

export async function toggleMic(roomId: string, enable: boolean): Promise<void> {
  await fetch(`/api/voice/rooms/${encodeURIComponent(roomId)}/mic`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enable }),
  });
}

