/**
 * JWT creation and verification using jose.
 */

import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "@/auth/types/authTypes";

const TOKEN_EXPIRY = "7d";

export function getSecret(secret: string): Uint8Array {
  if (!secret || secret.length < 16) {
    const e = new Error("SESSION_SECRET_NOT_CONFIGURED") as Error & { code?: string };
    e.code = "SESSION_SECRET_NOT_CONFIGURED";
    throw e;
  }
  return new TextEncoder().encode(secret);
}

/** Create a JWT string for the given session payload. */
export async function createToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
  secret: Uint8Array
): Promise<string> {
  const claims: Record<string, unknown> = {
    sub: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
  };
  if (payload.sessionId) claims.sessionId = payload.sessionId;
  if (payload.session_version != null) claims.session_version = payload.session_version;
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
}

/** Verify a JWT string and return the payload, or null. */
export async function verifyToken(
  token: string,
  secret: Uint8Array
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      email: (payload.email as string) ?? "",
      name: (payload.name as string | null) ?? null,
      sessionId: (payload.sessionId as string) ?? undefined,
      session_version: (payload.session_version as number) ?? undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
