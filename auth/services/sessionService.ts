/**
 * Session lifecycle: create (set cookie), get (read cookie), destroy (clear cookie).
 * Also resolves NextAuth (Google OAuth) session so the app sees a single session shape.
 * Cookie-based sessions create a user_sessions record and store sessionId in JWT.
 */

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { createSessionToken, verifySessionToken } from "@/auth/services/tokenService";
import {
  createSessionRecord,
  updateLastActive,
  getSessionById,
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
async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const currentVersion = await getSessionVersionForUser(payload.sub);
  if ((payload.session_version ?? 1) !== currentVersion) {
    return null; // token invalidated by session_version bump → 401
  }
  // Cookie-based tokens must include session_id and have a valid, non-revoked session row
  if (!payload.sessionId) {
    return null; // token must have session_id for auth
  }
  const session = await getSessionById(payload.sessionId);
  if (!session || session.revoked === true) {
    return null; // session missing or revoked → 401 Unauthorized
  }
  await updateLastActive(payload.sessionId).catch(() => {});
  return payload;
}

/**
 * Get current session: circle_session cookie (email/password) or NextAuth (Google OAuth).
 * Returns the same SessionPayload shape for both.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const fromCookie = await getSessionFromCookie();
  if (fromCookie) return fromCookie;

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
