/**
 * Shared TypeScript types for the auth module.
 */

/** Session payload stored in JWT and used across the app. */
export type SessionPayload = {
  sub: string; // user id (uuid)
  email: string;
  name: string | null;
  sessionId?: string; // user_sessions.id for cookie-based auth
  session_version?: number; // must match users.session_version or token is rejected
  iat?: number;
  exp?: number;
};

/** Input for login. */
export type LoginInput = {
  email: string;
  password: string;
  deviceId?: string;
};

/** Input for registration. */
export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  deviceFingerprint?: string;
  acoCode?: string;
};

/** User row as returned from DB for auth (login). */
export type AuthUserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  status: string | null;
};

/** Result of successful login or register. */
export type AuthUserResult = {
  id: string;
  email: string;
  name?: string;
};

/** Options passed when creating a session (e.g. after login/register). */
export type CreateSessionInput = Omit<SessionPayload, "iat" | "exp">;
/** Extended input when creating a session with a DB record (sessionId required). */
export type CreateSessionWithRecordInput = CreateSessionInput & { sessionId: string };
