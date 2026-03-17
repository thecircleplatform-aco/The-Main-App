/**
 * Token creation and verification. Uses auth utils/jwt and core env for secret.
 */

import { getSessionSecret } from "@/core/env";
import { getSecret, createToken, verifyToken } from "@/auth/utils/jwt";
import type { SessionPayload } from "@/auth/types/authTypes";

function getSecretBytes(): Uint8Array {
  return getSecret(getSessionSecret());
}

/** Create a JWT string for the given session payload. */
export async function createSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp">
): Promise<string> {
  return createToken(payload, getSecretBytes());
}

/** Verify a JWT string and return the payload, or null. */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  const secret = getSessionSecret();
  if (!secret || secret.length < 16) return null;
  return verifyToken(token, getSecretBytes());
}
