/**
 * Core user authentication and session validation.
 * Session creation/destruction lives in @/services/auth; this module
 * defines types and validation used across the platform.
 */

export type SessionPayload = {
  sub: string; // user id (uuid)
  email: string;
  name: string | null;
  iat?: number;
  exp?: number;
};

/** Re-export session types; actual getSession/createSession/destroySession are in services/auth. */
export type { SessionPayload as UserSession };
