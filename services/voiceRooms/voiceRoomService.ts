import { query } from "@/database/db";
import { getSession } from "@/services/auth";
import { broadcastVoiceRoom } from "./voiceRoomSocket";

type UUID = string;

export type VoiceRoomStatus = "scheduled" | "live" | "ended";

export type VoiceRoom = {
  id: UUID;
  circle_id: UUID;
  topic: string;
  host_user_id: UUID;
  max_speakers: number;
  status: VoiceRoomStatus;
  started_at: string;
  ended_at: string | null;
  livekit_room_name: string | null;
};

export type VoiceRoomSeat = {
  id: UUID;
  room_id: UUID;
  user_id: UUID;
  seat_number: number;
  mic_enabled: boolean;
  joined_at: string;
};

export type VoiceRoomListener = {
  id: UUID;
  room_id: UUID;
  user_id: UUID;
  joined_at: string;
};

async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

async function ensureCircleMember(circleId: string, userId: string) {
  const res = await query<{ id: string; role: string }>(
    "SELECT id, role FROM circle_members WHERE circle_id = $1 AND user_id = $2",
    [circleId, userId]
  );
  const row = res.rows[0];
  if (!row) {
    throw new Error("FORBIDDEN_NOT_CIRCLE_MEMBER");
  }
  return row;
}

export async function createVoiceRoom(params: {
  circleId: string;
  topic: string;
  maxSpeakers?: number;
}): Promise<VoiceRoom> {
  const session = await requireSession();

  const circleRes = await query<{ id: string }>(
    "SELECT id FROM circles WHERE id = $1 OR slug = $2",
    [params.circleId, params.circleId]
  );
  const circle = circleRes.rows[0];
  if (!circle) throw new Error("CIRCLE_NOT_FOUND");

  const member = await ensureCircleMember(circle.id, session.sub);
  if (member.role !== "admin" && member.role !== "moderator") {
    throw new Error("FORBIDDEN_NOT_HOST");
  }

  const maxSpeakers = params.maxSpeakers ?? 8;

  const insert = await query<VoiceRoom>(
    `INSERT INTO voice_rooms (circle_id, topic, host_user_id, max_speakers, status)
     VALUES ($1, $2, $3, $4, 'live')
     RETURNING *`,
    [circle.id, params.topic, session.sub, maxSpeakers]
  );
  return insert.rows[0];
}

export async function endVoiceRoom(roomId: string): Promise<void> {
  const session = await requireSession();

  const res = await query<VoiceRoom>("SELECT * FROM voice_rooms WHERE id = $1", [roomId]);
  const room = res.rows[0];
  if (!room) throw new Error("ROOM_NOT_FOUND");
  if (room.host_user_id !== session.sub) throw new Error("FORBIDDEN_NOT_HOST");

  await query("UPDATE voice_rooms SET status = 'ended', ended_at = now() WHERE id = $1", [
    roomId,
  ]);
}

export async function getActiveVoiceRoomForCircle(circleIdOrSlug: string): Promise<VoiceRoom | null> {
  const res = await query<VoiceRoom>(
    `SELECT vr.*
     FROM voice_rooms vr
     JOIN circles c ON c.id = vr.circle_id
     WHERE (c.id = $1 OR c.slug = $1) AND vr.status = 'live'
     ORDER BY vr.started_at DESC
     LIMIT 1`,
    [circleIdOrSlug]
  );
  return res.rows[0] ?? null;
}

export async function joinVoiceRoomAsListener(roomId: string): Promise<void> {
  const session = await requireSession();

  const roomRes = await query<VoiceRoom>(
    "SELECT * FROM voice_rooms WHERE id = $1 AND status = 'live'",
    [roomId]
  );
  const room = roomRes.rows[0];
  if (!room) throw new Error("ROOM_NOT_FOUND_OR_ENDED");

  await ensureCircleMember(room.circle_id, session.sub);

  await query(
    `INSERT INTO voice_room_listeners (room_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (room_id, user_id) DO NOTHING`,
    [roomId, session.sub]
  );

  const countRes = await query<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM voice_room_listeners WHERE room_id = $1",
    [roomId]
  );
  const listenerCount = parseInt(countRes.rows[0]?.count ?? "0", 10);

  broadcastVoiceRoom(roomId, {
    type: "listener_count_updated",
    data: { roomId, listenerCount },
  });
}

export async function leaveVoiceRoom(roomId: string): Promise<void> {
  const session = await requireSession();

  await query("DELETE FROM voice_room_listeners WHERE room_id = $1 AND user_id = $2", [
    roomId,
    session.sub,
  ]);
  await query("DELETE FROM voice_room_seats WHERE room_id = $1 AND user_id = $2", [
    roomId,
    session.sub,
  ]);
}

export async function requestSeat(roomId: string): Promise<void> {
  const session = await requireSession();

  const roomRes = await query<VoiceRoom>(
    "SELECT * FROM voice_rooms WHERE id = $1 AND status = 'live'",
    [roomId]
  );
  const room = roomRes.rows[0];
  if (!room) throw new Error("ROOM_NOT_FOUND_OR_ENDED");

  await ensureCircleMember(room.circle_id, session.sub);

  await query(
    `INSERT INTO voice_room_requests (room_id, user_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (room_id, user_id, status) DO NOTHING`,
    [roomId, session.sub]
  );
}

export async function approveSeatRequest(roomId: string, userId: string): Promise<void> {
  const session = await requireSession();

  const roomRes = await query<VoiceRoom>("SELECT * FROM voice_rooms WHERE id = $1", [roomId]);
  const room = roomRes.rows[0];
  if (!room) throw new Error("ROOM_NOT_FOUND");
  if (room.host_user_id !== session.sub) throw new Error("FORBIDDEN_NOT_HOST");

  const seatsRes = await query<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM voice_room_seats WHERE room_id = $1",
    [roomId]
  );
  const currentSeats = parseInt(seatsRes.rows[0]?.count ?? "0", 10);
  if (currentSeats >= room.max_speakers) {
    throw new Error("MAX_SPEAKERS_REACHED");
  }

  const seatNumberRes = await query<{ seat_number: number }>(
    `SELECT s.seat_number
     FROM generate_series(1, $1) AS s(seat_number)
     WHERE NOT EXISTS (
       SELECT 1 FROM voice_room_seats vrs
       WHERE vrs.room_id = $2 AND vrs.seat_number = s.seat_number
     )
     ORDER BY s.seat_number
     LIMIT 1`,
    [room.max_speakers, roomId]
  );
  const seatNumber = seatNumberRes.rows[0]?.seat_number ?? 1;

  await query(
    `INSERT INTO voice_room_seats (room_id, user_id, seat_number, mic_enabled)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (room_id, user_id) DO NOTHING`,
    [roomId, userId, seatNumber]
  );

  await query(
    `UPDATE voice_room_requests
     SET status = 'accepted', resolved_at = now()
     WHERE room_id = $1 AND user_id = $2 AND status = 'pending'`,
    [roomId, userId]
  );
}

export async function removeSpeaker(roomId: string, userId: string): Promise<void> {
  const session = await requireSession();

  const roomRes = await query<VoiceRoom>("SELECT * FROM voice_rooms WHERE id = $1", [roomId]);
  const room = roomRes.rows[0];
  if (!room) throw new Error("ROOM_NOT_FOUND");
  if (room.host_user_id !== session.sub) throw new Error("FORBIDDEN_NOT_HOST");

  await query("DELETE FROM voice_room_seats WHERE room_id = $1 AND user_id = $2", [
    roomId,
    userId,
  ]);
}

