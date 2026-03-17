/**
 * Core authentication logic: login, register. Uses Neon PostgreSQL via @/database/db.
 */

import { query } from "@/database/db";
import { verifyPassword, hashPassword } from "@/auth/services/passwordService";
import { createSessionWithRecord } from "@/auth/services/sessionService";
import { validateAcoCode, recordAcoCodeUsage } from "@/auth/services/acoCodeService";
import type { AuthUserRow, AuthUserResult, LoginInput, RegisterInput } from "@/auth/types/authTypes";
import { getClientIp } from "@/core/utils/request-utils";

/** Result of login attempt. */
export type LoginResult =
  | { success: true; user: AuthUserResult }
  | { success: false; error: string; status: 401 | 403 };

/**
 * Authenticate user by email/password, enforce status, create session, record IP.
 * Request is only used for getClientIp; pass it from the controller.
 */
export async function login(
  input: LoginInput,
  request: Request
): Promise<LoginResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const ip = getClientIp(request);

  const res = await query<AuthUserRow>(
    "SELECT id, email, name, password_hash, COALESCE(status, 'active') as status FROM users WHERE lower(email) = $1",
    [normalizedEmail]
  );
  const row = res.rows[0];
  if (!row) {
    return { success: false, error: "Invalid email or password.", status: 401 };
  }

  if (row.status === "blocked" || row.status === "shadow_banned") {
    return {
      success: false,
      error:
        "Your account has been blocked. If you believe this is a mistake, please contact support.",
      status: 403,
    };
  }

  if (!row.password_hash) {
    return {
      success: false,
      error:
        "This account has no password set. Use a different login method or reset your account.",
      status: 401,
    };
  }

  const valid = await verifyPassword(input.password, row.password_hash);
  if (!valid) {
    return { success: false, error: "Invalid email or password.", status: 401 };
  }

  await createSessionWithRecord(
    request,
    { id: row.id, email: row.email, name: row.name },
    input.deviceId ?? null
  );

  if (ip) {
    await query(
      `INSERT INTO user_ips (user_id, ip_address, device_id) VALUES ($1, $2, $3)`,
      [row.id, ip, input.deviceId ?? null]
    ).catch(() => {});
  }

  return {
    success: true,
    user: { id: row.id, email: row.email, name: row.name ?? undefined },
  };
}

/** Result of phone OTP login/signup. */
export type LoginByPhoneResult =
  | { success: true; user: AuthUserResult }
  | { success: false; error: string; status: 401 | 403 | 500 };

/**
 * After OTP is verified: find user by phone or create new one (provider = phone).
 * Session uses synthetic email for phone-only users: phone@phone.circle.
 */
export async function loginByPhoneOrCreate(
  phoneNumber: string,
  request: Request,
  deviceFingerprint?: string | null
): Promise<LoginByPhoneResult> {
  const { normalizePhone } = await import("@/auth/services/otpService");
  const normalized = normalizePhone(phoneNumber);
  if (!normalized || normalized.length < 10) {
    return { success: false, error: "Invalid phone number.", status: 401 };
  }

  const ip = getClientIp(request);
  const syntheticEmail = `${normalized}@phone.circle`;

  const existing = await query<{
    id: string;
    email: string;
    name: string | null;
    status: string | null;
    phone_login_disabled: boolean | null;
  }>(
    `SELECT id, email, name, COALESCE(status, 'active') as status,
            COALESCE(phone_login_disabled, false) as phone_login_disabled
     FROM users WHERE phone_number = $1`,
    [normalized]
  );
  const row = existing.rows[0];

  if (row) {
    if (row.status === "blocked" || row.status === "shadow_banned") {
      return {
        success: false,
        error:
          "Your account has been blocked. If you believe this is a mistake, please contact support.",
        status: 403,
      };
    }
    if (row.phone_login_disabled) {
      return {
        success: false,
        error: "Phone login is disabled for this account. Use another sign-in method.",
        status: 403,
      };
    }

    await createSessionWithRecord(
      request,
      { id: row.id, email: row.email, name: row.name },
      deviceFingerprint ?? null
    );
    if (ip) {
      await query(
        `INSERT INTO user_ips (user_id, ip_address, device_id) VALUES ($1, $2, $3)`,
        [row.id, ip, deviceFingerprint ?? null]
      ).catch(() => {});
    }
    return {
      success: true,
      user: { id: row.id, email: row.email, name: row.name ?? undefined },
    };
  }

  if (deviceFingerprint) {
    const existingDevice = await query<{ user_id: string }>(
      "SELECT user_id FROM devices WHERE device_fingerprint = $1",
      [deviceFingerprint]
    ).catch(() => ({ rows: [] }));
    if (existingDevice.rows.length > 0) {
      return {
        success: false,
        error: "Only one account is allowed per device.",
        status: 403,
      };
    }
    const abuseCount = await query<{ count: string }>(
      `SELECT count(*)::text as count FROM account_creation_logs
       WHERE device_fingerprint = $1 AND created_at > now() - interval '30 days'`,
      [deviceFingerprint]
    ).catch(() => ({ rows: [{ count: "0" }] }));
    const count = parseInt(abuseCount.rows[0]?.count ?? "0", 10);
    if (count >= 10) {
      return {
        success: false,
        error:
          "Your device has exceeded account creation limits. Please contact support.",
        status: 403,
      };
    }
  }

  const insert = await query<{ id: string; email: string; name: string | null }>(
    `INSERT INTO users (email, name, phone_number, phone_verified, provider)
     VALUES ($1, $2, $3, true, 'phone')
     RETURNING id, email, name`,
    [syntheticEmail, null, normalized]
  );
  const newRow = insert.rows[0];
  if (!newRow) {
    return { success: false, error: "Registration failed.", status: 500 };
  }

  if (deviceFingerprint) {
    await query(
      `INSERT INTO devices (device_fingerprint, user_id) VALUES ($1, $2) ON CONFLICT (device_fingerprint) DO NOTHING`,
      [deviceFingerprint, newRow.id]
    ).catch(() => {});
    await query(
      `INSERT INTO account_creation_logs (device_fingerprint, ip_address) VALUES ($1, $2)`,
      [deviceFingerprint, ip ?? "unknown"]
    ).catch(() => {});
  }
  if (ip) {
    await query(
      `INSERT INTO user_ips (user_id, ip_address, device_id) VALUES ($1, $2, $3)`,
      [newRow.id, ip, deviceFingerprint ?? null]
    ).catch(() => {});
  }

  await createSessionWithRecord(
    request,
    { id: newRow.id, email: newRow.email, name: newRow.name },
    deviceFingerprint ?? null
  );

  return {
    success: true,
    user: { id: newRow.id, email: newRow.email, name: newRow.name ?? undefined },
  };
}

/** Result of register attempt. */
export type RegisterResult =
  | { success: true; user: AuthUserResult }
  | { success: false; error: string; status: 400 | 403 | 409 | 500 };

/**
 * Register a new user: check device/abuse, email uniqueness, hash password, insert user,
 * record device/IP, create session.
 */
export async function register(
  input: RegisterInput,
  request: Request
): Promise<RegisterResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const ip = getClientIp(request);
  const { deviceFingerprint } = input;

  if (deviceFingerprint) {
    const existingDevice = await query<{ user_id: string }>(
      "SELECT user_id FROM devices WHERE device_fingerprint = $1",
      [deviceFingerprint]
    ).catch(() => ({ rows: [] }));
    if (existingDevice.rows.length > 0) {
      return {
        success: false,
        error: "Only one account is allowed per device.",
        status: 403,
      };
    }

    const abuseCount = await query<{ count: string }>(
      `SELECT count(*)::text as count FROM account_creation_logs
       WHERE device_fingerprint = $1 AND created_at > now() - interval '30 days'`,
      [deviceFingerprint]
    ).catch(() => ({ rows: [{ count: "0" }] }));
    const count = parseInt(abuseCount.rows[0]?.count ?? "0", 10);
    if (count >= 10) {
      return {
        success: false,
        error:
          "Your device has exceeded account creation limits. Please contact support if you believe this is a mistake.",
        status: 403,
      };
    }
  }

  const existing = await query<{ id: string }>(
    "SELECT id FROM users WHERE lower(email) = $1",
    [normalizedEmail]
  );
  if (existing.rows.length > 0) {
    return {
      success: false,
      error: "An account with this email already exists.",
      status: 409,
    };
  }

  let role = "user" as string;
  let acoCodeId: string | null = null;
  if (input.acoCode?.trim()) {
    const validated = await validateAcoCode(input.acoCode.trim());
    if (!validated.ok) {
      return { success: false, error: validated.error, status: 400 };
    }
    role = validated.code.role;
    acoCodeId = validated.code.id;
  }

  const passwordHash = await hashPassword(input.password);
  const insert = await query<{ id: string; email: string; name: string | null }>(
    `INSERT INTO users (email, name, password_hash, role, aco_code_used)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name`,
    [normalizedEmail, input.name?.trim() || null, passwordHash, role, acoCodeId]
  );
  const row = insert.rows[0];
  if (!row) {
    return { success: false, error: "Registration failed.", status: 500 };
  }

  if (acoCodeId) {
    await recordAcoCodeUsage(acoCodeId, row.id);
  }

  if (deviceFingerprint) {
    await query(
      `INSERT INTO devices (device_fingerprint, user_id) VALUES ($1, $2) ON CONFLICT (device_fingerprint) DO NOTHING`,
      [deviceFingerprint, row.id]
    ).catch(() => {});
    await query(
      `INSERT INTO account_creation_logs (device_fingerprint, ip_address) VALUES ($1, $2)`,
      [deviceFingerprint, ip ?? "unknown"]
    ).catch(() => {});
  }

  if (ip) {
    await query(
      `INSERT INTO user_ips (user_id, ip_address, device_id) VALUES ($1, $2, $3)`,
      [row.id, ip, deviceFingerprint ?? null]
    ).catch(() => {});
  }

  await createSessionWithRecord(
    request,
    { id: row.id, email: row.email, name: row.name },
    deviceFingerprint ?? null
  );

  return {
    success: true,
    user: { id: row.id, email: row.email, name: row.name ?? undefined },
  };
}
