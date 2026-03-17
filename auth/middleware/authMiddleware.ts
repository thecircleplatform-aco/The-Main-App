/**
 * Auth middleware: get session for protected routes. Use in API route handlers.
 */

import { getSession } from "@/auth/services/sessionService";
import type { SessionPayload } from "@/auth/types/authTypes";

/**
 * Get the current session. Returns null if not authenticated.
 * Use in API routes that require optional or required auth.
 */
export async function requireSession(): Promise<SessionPayload | null> {
  return getSession();
}

/**
 * Get session or throw a response-ready object for 401.
 * Use when the route must be authenticated.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    const err = new Error("UNAUTHORIZED") as Error & { status?: number; json?: object };
    err.status = 401;
    err.json = { error: "Authentication required." };
    throw err;
  }
  return session;
}
