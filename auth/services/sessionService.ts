/**
 * Session lifecycle: create (set cookie), get (read cookie), destroy (clear cookie).
 * Also resolves NextAuth (Google OAuth) session so the app sees a single session shape.
 * Cookie-based sessions create a user_sessions record and store sessionId in JWT.
 */

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { createSessionToken, verifySessionToken } from "@/auth/services/tokenService";
import { query } from "@/database/db";
import {
  createSessionRecord,
  updateLastActive,
  getSessionVersionForUser,
} from "@/auth/services/sessionRecordService";
import type { CreateSessionInput } from "@/auth/types/authTypes";
import type { SessionPayload } from "@/auth/types/authTypes";
import { nextAuthOptions } from "@/auth/config/next-auth";

const COOKIE_NAME = "circle_session";
const MAX_AGE_DAYS = 7;

/** Create a session: issue JWT and set httpOnly cookie. */
export async function createSession(payload: CreateSessionInput): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * MAX_AGE_DAYS,
    path: "/",
  });
}

/** Create a session record in DB, then set cookie with sessionId and session_version in JWT. */
export async function createSessionWithRecord(
  request: Request,
  user: { id: string; email: string; name: string | null },
  deviceFingerprint?: string | null
): Promise<void> {
  const sessionId = await createSessionRecord({
    request,
    userId: user.id,
    deviceFingerprint,
  });
  const sessionVersion = await getSessionVersionForUser(user.id);
  await createSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    sessionId,
    session_version: sessionVersion,
  });
}

/** Read and verify the session cookie; check revoked and session_version (returns null so callers return 401), update last_active. */
async function getSessionFromCookieToken(token: string): Promise<SessionPayload | null> {
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  // Cookie-based tokens must include session_id and have a valid, non-revoked session row
  if (!payload.sessionId) {
    return null; // token must have session_id for auth
  }

  // Minimize per-request DB roundtrips: verify session + session_version in one query.
  const authRes = await query<{ revoked: boolean; session_version: string | null }>(
    `SELECT us.revoked, u.session_version::text AS session_version
     FROM user_sessions us
     JOIN users u ON u.id = us.user_id
     WHERE us.id = $1`,
    [payload.sessionId]
  );
  const authRow = authRes.rows[0];
  if (!authRow || authRow.revoked === true) return null;

  const currentVersion =
    authRow.session_version != null ? parseInt(authRow.session_version, 10) : 1;
  if ((payload.session_version ?? 1) !== currentVersion) return null;

  // Don't block the response on last_active updates.
  void updateLastActive(payload.sessionId).catch(() => {});
  return payload;
}

/**
 * Get current session: circle_session cookie (email/password) or NextAuth (Google OAuth).
 * Returns the same SessionPayload shape for both.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();

  const circleToken = cookieStore.get(COOKIE_NAME)?.value;
  if (circleToken) {
    const fromCookie = await getSessionFromCookieToken(circleToken);
    if (fromCookie) return fromCookie;
  }

  // Avoid the expensive NextAuth machinery when we clearly have no NextAuth cookies.
  const hasNextAuthCookie =
    cookieStore.has("next-auth.session-token") ||
    cookieStore.has("__Secure-next-auth.session-token");
  if (!hasNextAuthCookie) return null;

  const nextAuthSession = await getServerSession(nextAuthOptions);
  const userId = nextAuthSession?.user && "id" in nextAuthSession.user && nextAuthSession.user.id;
  if (userId && nextAuthSession?.user?.email) {
    return {
      sub: userId,
      email: nextAuthSession.user.email,
      name: nextAuthSession.user.name ?? null,
    };
  }
  return null;
}

/** Clear the session cookie (logout). Does not sign out of NextAuth; use /api/auth/signout for OAuth users. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
