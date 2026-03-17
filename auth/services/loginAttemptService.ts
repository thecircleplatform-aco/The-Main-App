/**
 * Login/register attempt recording and rate limit checks. Uses Neon PostgreSQL.
 */

import { query } from "@/database/db";

const LOGIN_FAILED_LIMIT = 5;
const LOGIN_WINDOW_MINUTES = 1;
const LOGIN_BLOCK_MINUTES = 10;
const REGISTER_LIMIT = 3;
const REGISTER_WINDOW_MINUTES = 1;

export type AttemptAction = "login" | "register";

/** Record a login or register attempt for rate limiting and monitoring. */
export async function recordAttempt(params: {
  ipAddress: string;
  email: string;
  success: boolean;
  action: AttemptAction;
}): Promise<void> {
  await query(
    `INSERT INTO login_attempts (ip_address, email, success, action)
     VALUES ($1, $2, $3, $4)`,
    [params.ipAddress, params.email, params.success, params.action]
  );
}

export type LoginRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds?: number };

/**
 * Enforce: max 5 failed logins per minute per IP; if exceeded, block for 10 minutes.
 */
export async function checkLoginRateLimit(ipAddress: string): Promise<LoginRateLimitResult> {
  if (!ipAddress) return { allowed: true };

  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);
  const failed = await query<{ count: string; oldest: string }>(
    `SELECT count(*)::text as count, min(created_at)::text as oldest
     FROM login_attempts
     WHERE ip_address = $1 AND action = 'login' AND success = false
       AND created_at > $2`,
    [ipAddress, windowStart]
  );
  const count = parseInt(failed.rows[0]?.count ?? "0", 10);
  const oldest = failed.rows[0]?.oldest;

  if (count < LOGIN_FAILED_LIMIT) return { allowed: true };

  if (!oldest) return { allowed: true };
  const blockEnd = new Date(new Date(oldest).getTime() + LOGIN_BLOCK_MINUTES * 60 * 1000);
  const now = new Date();
  if (now < blockEnd) {
    const retryAfterSeconds = Math.ceil((blockEnd.getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}

export type RegisterRateLimitResult = { allowed: true } | { allowed: false };

/** Enforce: max 3 registrations per minute per IP. */
export async function checkRegisterRateLimit(ipAddress: string): Promise<RegisterRateLimitResult> {
  if (!ipAddress) return { allowed: true };

  const windowStart = new Date(Date.now() - REGISTER_WINDOW_MINUTES * 60 * 1000);
  const res = await query<{ count: string }>(
    `SELECT count(*)::text as count
     FROM login_attempts
     WHERE ip_address = $1 AND action = 'register'
       AND created_at > $2`,
    [ipAddress, windowStart]
  );
  const count = parseInt(res.rows[0]?.count ?? "0", 10);
  return count >= REGISTER_LIMIT ? { allowed: false } : { allowed: true };
}
