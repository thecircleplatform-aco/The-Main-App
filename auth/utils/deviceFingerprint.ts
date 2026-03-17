/**
 * Device fingerprint utilities for auth and abuse prevention.
 * Generates a stable hash from user-agent, language, platform, and optional screen resolution.
 */

import { createHash } from "crypto";

/** Validate fingerprint format (non-empty string). Used before storing or looking up. */
export function isValidFingerprint(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Normalize fingerprint for storage (trim, optional length cap). */
export function normalizeFingerprint(value: string): string {
  return value.trim().slice(0, 512);
}

/**
 * Hash a combined string to produce a stable device fingerprint.
 * Use this with components from the client (userAgent, language, platform, screenResolution)
 * or from server headers.
 */
export function hashFingerprintInput(combined: string): string {
  return createHash("sha256").update(combined, "utf8").digest("hex").slice(0, 64);
}

export type FingerprintComponents = {
  userAgent: string;
  language?: string;
  platform?: string;
  screenResolution?: string;
};

/**
 * Build a stable fingerprint from components (e.g. sent by client or from request headers).
 * Order and format are fixed so the same inputs always produce the same hash.
 */
export function buildFingerprintFromComponents(components: FingerprintComponents): string {
  const parts = [
    components.userAgent ?? "",
    components.language ?? "",
    components.platform ?? "",
    components.screenResolution ?? "",
  ];
  return hashFingerprintInput(parts.join("|"));
}

/**
 * Generate a device fingerprint from request headers only.
 * Used when the client does not send a fingerprint (e.g. login with deviceId only).
 * Uses: user-agent, accept-language, sec-ch-ua-platform (or fallbacks).
 */
export function getDeviceFingerprintFromRequest(request: Request): string {
  const userAgent = request.headers.get("user-agent") ?? "";
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const platform =
    request.headers.get("sec-ch-ua-platform") ??
    request.headers.get("x-requested-with") ??
    "";
  return buildFingerprintFromComponents({
    userAgent,
    language: acceptLanguage.split(",")[0]?.trim() ?? "",
    platform,
  });
}
