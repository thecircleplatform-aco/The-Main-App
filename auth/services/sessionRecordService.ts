/**
 * User session records: create on login, update last_active, revoke.
 * Used with user_sessions table for device tracking and "log out other devices".
 */

import { query } from "@/database/db";
import { parseDeviceName } from "@/auth/utils/userAgent";
import { getClientIP } from "@/auth/utils/ipUtils";

declare global {
  // eslint-disable-next-line no-var
  var __circle_lastActiveTick: Map<string, number> | undefined;
}

export type CreateSessionRecordInput = {
  request: Request;
  userId: string;
  deviceFingerprint?: string | null;
};

/** Create a user_sessions row and return its id. */
export async function createSessionRecord(
  input: CreateSessionRecordInput
): Promise<string> {
  const ip = getClientIP(input.request) ?? null;
  const ua = input.request.headers.get("user-agent");
  const deviceName = parseDeviceName(ua);

  const res = await query<{ id: string }>(
    `INSERT INTO user_sessions (user_id, device_name, ip_address, device_fingerprint, revoked)
     VALUES ($1, $2, $3, $4, false)
     RETURNING id`,
    [input.userId, deviceName, ip, input.deviceFingerprint ?? null]
  );
  const row = res.rows[0];
  if (!row) throw new Error("Failed to create session record");
  return row.id;
}

/** Update last_active for a session (call on each authenticated request). */
export async function updateLastActive(sessionId: string): Promise<void> {
  const now = Date.now();
  const tick = (globalThis.__circle_lastActiveTick ??= new Map<string, number>());
  const last = tick.get(sessionId) ?? 0;
  // Avoid writing on every request (remote DB latency is painful in dev).
  if (now - last < 60_000) return;
  tick.set(sessionId, now);

  await query(
    `UPDATE user_sessions SET last_active = now() WHERE id = $1 AND revoked = false`,
    [sessionId]
  );
}

/** Fetch session row by id. Returns null if not found. Used by auth to deny when missing or revoked. */
export async function getSessionById(
  sessionId: string
): Promise<SessionRow | null> {
  const res = await query<SessionRow>(
    `SELECT id, device_name, ip_address, device_fingerprint, created_at, last_active, revoked
     FROM user_sessions WHERE id = $1`,
    [sessionId]
  );
  return res.rows[0] ?? null;
}

/** Check if session is revoked or missing (treat missing as revoked so request is denied). */
export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  const session = await getSessionById(sessionId);
  return session == null || session.revoked === true;
}

/** Revoke a single session. */
export async function revokeSession(sessionId: string): Promise<void> {
  await query(
    `UPDATE user_sessions SET revoked = true WHERE id = $1`,
    [sessionId]
  );
}

/** Revoke all sessions for a user (e.g. on suspicious behavior). */
export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await query(
    `UPDATE user_sessions SET revoked = true WHERE user_id = $1`,
    [userId]
  );
}

/** Get current session_version for a user (for token validation). */
export async function getSessionVersionForUser(userId: string): Promise<number> {
  const res = await query<{ session_version: string }>(
    `SELECT COALESCE(session_version, 1)::text as session_version FROM users WHERE id = $1`,
    [userId]
  );
  const val = res.rows[0]?.session_version;
  return val != null ? parseInt(val, 10) : 1;
}

/** Increment user's session_version to invalidate all existing tokens. */
export async function incrementSessionVersion(userId: string): Promise<void> {
  await query(
    `UPDATE users SET session_version = COALESCE(session_version, 1) + 1 WHERE id = $1`,
    [userId]
  );
}

/** Revoke all sessions for a user except one. */
export async function revokeAllSessionsForUserExcept(
  userId: string,
  exceptSessionId: string
): Promise<void> {
  await query(
    `UPDATE user_sessions SET revoked = true WHERE user_id = $1 AND id != $2`,
    [userId, exceptSessionId]
  );
}

export type SessionRow = {
  id: string;
  device_name: string | null;
  ip_address: string | null;
  device_fingerprint: string | null;
  created_at: string;
  last_active: string;
  revoked: boolean;
};

/** List non-revoked sessions for a user, most recent first. */
export async function listSessionsForUser(
  userId: string
): Promise<SessionRow[]> {
  const res = await query<SessionRow>(
    `SELECT id, device_name, ip_address, device_fingerprint, created_at, last_active, revoked
     FROM user_sessions
     WHERE user_id = $1 AND revoked = false
     ORDER BY last_active DESC`,
    [userId]
  );
  return res.rows;
}

/** Parse device_name into browser and OS for display (device_name is "Browser on OS"). */
export function parseDeviceNameForDisplay(deviceName: string | null): {
  browser: string;
  os: string;
} {
  if (!deviceName || !deviceName.trim()) {
    return { browser: "Unknown", os: "Unknown" };
  }
  const onIndex = deviceName.indexOf(" on ");
  if (onIndex === -1) return { browser: deviceName.trim(), os: "Unknown" };
  return {
    browser: deviceName.slice(0, onIndex).trim(),
    os: deviceName.slice(onIndex + 4).trim(),
  };
}
