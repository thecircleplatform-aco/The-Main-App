/**
 * Phone OTP: generate, store, validate, rate limits.
 * - 6-digit OTP, 5 min expiry, max 5 verification attempts, single-use.
 * - Max 3 OTP requests per phone per hour; rate limit send-otp by IP in route.
 */

import { query } from "@/database/db";

const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFICATION_ATTEMPTS = 5;
const MAX_OTP_REQUESTS_PER_PHONE_PER_HOUR = 3;

/** Normalize to E.164-like: digits only, optional leading + */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

/** Generate 6-digit numeric OTP */
export function generateOtpCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(6, "0");
}

export type StoreOtpResult =
  | { ok: true; otpCode: string }
  | { ok: false; error: string };

/**
 * Store new OTP for phone. Enforces max 3 requests per phone per hour.
 * Invalidates any previous OTP for this phone (delete old then insert).
 */
export async function storeOtp(
  phoneNumber: string,
  ipAddress: string
): Promise<StoreOtpResult> {
  const normalized = normalizePhone(phoneNumber);
  if (!normalized || normalized.length < 10) {
    return { ok: false, error: "Invalid phone number." };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const countRes = await query<{ count: string }>(
    `SELECT count(*)::text as count FROM phone_otp_requests
     WHERE phone_number = $1 AND created_at > $2`,
    [normalized, hourAgo]
  );
  const count = parseInt(countRes.rows[0]?.count ?? "0", 10);
  if (count >= MAX_OTP_REQUESTS_PER_PHONE_PER_HOUR) {
    return {
      ok: false,
      error: "Too many OTP requests for this number. Try again in an hour.",
    };
  }

  await query(
    `DELETE FROM phone_otps WHERE phone_number = $1`,
    [normalized]
  );

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await query(
    `INSERT INTO phone_otps (phone_number, otp_code, expires_at)
     VALUES ($1, $2, $3)`,
    [normalized, otpCode, expiresAt]
  );

  await query(
    `INSERT INTO phone_otp_requests (phone_number, ip_address) VALUES ($1, $2)`,
    [normalized, ipAddress]
  );

  return { ok: true, otpCode };
}

export type ValidateOtpResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Validate OTP for phone: match code, not expired, attempts < 5.
 * On success deletes the OTP (single-use).
 */
export async function validateOtp(
  phoneNumber: string,
  otpCode: string
): Promise<ValidateOtpResult> {
  const normalized = normalizePhone(phoneNumber);
  if (!normalized) return { ok: false, error: "Invalid phone number." };

  const trimmed = otpCode.replace(/\D/g, "");
  if (trimmed.length !== 6) return { ok: false, error: "Invalid OTP code." };

  const row = await query<{
    id: string;
    otp_code: string;
    expires_at: string;
    attempts: number;
  }>(
    `SELECT id, otp_code, expires_at, attempts FROM phone_otps
     WHERE phone_number = $1 ORDER BY created_at DESC LIMIT 1`,
    [normalized]
  );
  const otpRow = row.rows[0];
  if (!otpRow) {
    return { ok: false, error: "No OTP found for this number. Request a new code." };
  }

  if (otpRow.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    await query(`DELETE FROM phone_otps WHERE phone_number = $1`, [normalized]);
    return { ok: false, error: "Too many failed attempts. Request a new code." };
  }

  const expired = new Date(otpRow.expires_at) < new Date();
  if (expired) {
    await query(`DELETE FROM phone_otps WHERE phone_number = $1`, [normalized]);
    return { ok: false, error: "Code expired. Request a new code." };
  }

  if (otpRow.otp_code !== trimmed) {
    await query(
      `UPDATE phone_otps SET attempts = attempts + 1 WHERE id = $1`,
      [otpRow.id]
    );
    return { ok: false, error: "Invalid code. Try again." };
  }

  await query(`DELETE FROM phone_otps WHERE id = $1`, [otpRow.id]);
  return { ok: true };
}
