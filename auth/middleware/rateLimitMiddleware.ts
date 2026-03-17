/**
 * Rate limiting for auth endpoints. Tracks by IP and (for login) email via login_attempts table.
 */

import {
  checkLoginRateLimit,
  checkRegisterRateLimit,
  recordAttempt,
  type AttemptAction,
} from "@/auth/services/loginAttemptService";
import { getClientIP } from "@/auth/utils/ipUtils";

export type LoginRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds?: number };

export type RegisterRateLimitResult = { allowed: true } | { allowed: false };

/**
 * Check login rate limit by IP. Call before attempting auth.
 * If 5+ failed attempts in the last minute for this IP, blocks for 10 minutes.
 */
export async function checkLoginRateLimitByRequest(
  request: Request
): Promise<LoginRateLimitResult> {
  const ip = getClientIP(request);
  return checkLoginRateLimit(ip ?? "unknown");
}

/**
 * Check register rate limit by IP. Max 3 registrations per minute per IP.
 */
export async function checkRegisterRateLimitByRequest(
  request: Request
): Promise<RegisterRateLimitResult> {
  const ip = getClientIP(request);
  return checkRegisterRateLimit(ip ?? "unknown");
}

/**
 * Record a login or register attempt. Call after auth attempt.
 */
export async function recordLoginAttempt(params: {
  request: Request;
  email: string;
  success: boolean;
  action: AttemptAction;
}): Promise<void> {
  const ip = getClientIP(params.request);
  await recordAttempt({
    ipAddress: ip ?? "unknown",
    email: params.email,
    success: params.success,
    action: params.action,
  });
}

/** Legacy export for password_reset; treats as allowed until implemented. */
export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds?: number };

export async function checkRateLimit(
  _identifier: string,
  action: "login" | "register" | "password_reset"
): Promise<RateLimitResult> {
  if (action === "password_reset") return { allowed: true };
  return { allowed: true };
}
