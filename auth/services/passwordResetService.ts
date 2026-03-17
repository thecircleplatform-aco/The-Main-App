/**
 * Password reset token lifecycle: create, validate, consume.
 * One active token per user; tokens expire after 15 minutes.
 */

import { randomUUID } from "crypto";
import { query } from "@/database/db";
import { hashPassword } from "@/auth/services/passwordService";

const EXPIRY_MINUTES = 15;
const RATE_LIMIT_PER_HOUR = 3;

export async function createResetToken(userId: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);
  await query(
    `DELETE FROM password_resets WHERE user_id = $1`,
    [userId]
  );
  await query(
    `INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
  return token;
}

export type ValidResetRow = { user_id: string };

export async function getValidResetToken(token: string): Promise<ValidResetRow | null> {
  const res = await query<ValidResetRow>(
    `SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > now()`,
    [token]
  );
  return res.rows[0] ?? null;
}

export async function consumeResetToken(token: string): Promise<boolean> {
  const res = await query(
    `DELETE FROM password_resets WHERE token = $1 RETURNING 1`,
    [token]
  );
  return res.rowCount !== null && res.rowCount > 0;
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const hashed = await hashPassword(newPassword);
  await query(
    `UPDATE users SET password_hash = $1, session_version = COALESCE(session_version, 1) + 1 WHERE id = $2`,
    [hashed, userId]
  );
}

export async function checkResetRequestRateLimit(ipAddress: string): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000);
  const res = await query<{ count: string }>(
    `SELECT count(*)::text as count FROM auth_events
     WHERE event_type = 'password_reset_request' AND ip_address = $1 AND created_at > $2`,
    [ipAddress, windowStart]
  );
  const count = parseInt(res.rows[0]?.count ?? "0", 10);
  return { allowed: count < RATE_LIMIT_PER_HOUR };
}

export async function recordResetRequestEvent(ipAddress: string): Promise<void> {
  await query(
    `INSERT INTO auth_events (user_id, ip_address, event_type, risk_score) VALUES (NULL, $1, 'password_reset_request', 0)`,
    [ipAddress]
  );
}
