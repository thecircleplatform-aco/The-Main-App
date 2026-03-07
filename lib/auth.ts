import { SignJWT, jwtVerify } from "jose";
import * as bcrypt from "bcryptjs";
import { getSessionSecret } from "@/lib/env";
import { cookies } from "next/headers";

const COOKIE_NAME = "circle_session";
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";

export type SessionPayload = {
  sub: string; // user id (uuid)
  email: string;
  name: string | null;
  iat?: number;
  exp?: number;
};

/** Hash a plain password for storage. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify a plain password against a hash. */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getSecret(): Uint8Array {
  const secret = getSessionSecret();
  if (!secret || secret.length < 16) {
    const e = new Error("SESSION_SECRET_NOT_CONFIGURED") as Error & {
      code?: string;
    };
    e.code = "SESSION_SECRET_NOT_CONFIGURED";
    throw e;
  }
  return new TextEncoder().encode(secret);
}

/** Create a JWT for the given user and set it in an httpOnly cookie. */
export async function createSession(payload: Omit<SessionPayload, "iat" | "exp">) {
  const secret = getSecret();
  const token = await new SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
  } as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/** Verify the session cookie and return the payload, or null. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = getSessionSecret();
  if (!secret || secret.length < 16) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return {
      sub: payload.sub as string,
      email: (payload.email as string) ?? "",
      name: (payload.name as string | null) ?? null,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/** Clear the session cookie (logout). */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
