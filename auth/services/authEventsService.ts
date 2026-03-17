/**
 * Auth events storage and risk-scoring data. Keeps queries minimal for <10ms risk calculation.
 */

import { query } from "@/database/db";

export type AuthEventType = "login_attempt" | "signup_attempt" | "password_reset_request";

export async function insertAuthEvent(params: {
  userId: string | null;
  ipAddress: string;
  deviceFingerprint: string | null;
  eventType: AuthEventType;
  riskScore: number;
  details?: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO auth_events (user_id, ip_address, device_fingerprint, event_type, risk_score, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.userId,
      params.ipAddress,
      params.deviceFingerprint,
      params.eventType,
      Math.max(0, Math.min(100, params.riskScore)),
      JSON.stringify(params.details ?? {}),
    ]
  );
}

/** Single query to fetch counts used for risk scoring (last 5 minutes). */
export type RiskCounts = {
  failedLoginsSameIp: number;
  signupsSameIp: number;
  accountCreationsSameDevice: number;
  knownDeviceForEmail: number;
};

export async function getRiskCounts(params: {
  ipAddress: string;
  deviceFingerprint: string | null;
  email: string | null;
  eventType: AuthEventType;
}): Promise<RiskCounts> {
  const windowStart = new Date(Date.now() - 5 * 60 * 1000);
  const ip = params.ipAddress || "unknown";
  const dev = params.deviceFingerprint ?? "";
  const email = params.email ?? "";

  const failedLogins = await query<{ count: string }>(
    `SELECT count(*)::text as count FROM login_attempts
     WHERE ip_address = $1 AND action = 'login' AND success = false AND created_at > $2`,
    [ip, windowStart]
  );
  const signupsIp = await query<{ count: string }>(
    `SELECT count(*)::text as count FROM login_attempts
     WHERE ip_address = $1 AND action = 'register' AND created_at > $2`,
    [ip, windowStart]
  );
  let accountCreationsDevice = 0;
  if (dev) {
    const ac = await query<{ count: string }>(
      `SELECT count(*)::text as count FROM account_creation_logs
       WHERE device_fingerprint = $1 AND created_at > $2`,
      [dev, windowStart]
    );
    accountCreationsDevice = parseInt(ac.rows[0]?.count ?? "0", 10);
  }
  let knownDeviceForEmail = 0;
  if (dev && email) {
    const devMatch = await query<{ count: string }>(
      `SELECT count(*)::text as count FROM devices d
       JOIN users u ON u.id = d.user_id
       WHERE d.device_fingerprint = $1 AND lower(u.email) = lower($2)`,
      [dev, email]
    );
    knownDeviceForEmail = parseInt(devMatch.rows[0]?.count ?? "0", 10);
  }

  return {
    failedLoginsSameIp: parseInt(failedLogins.rows[0]?.count ?? "0", 10),
    signupsSameIp: parseInt(signupsIp.rows[0]?.count ?? "0", 10),
    accountCreationsSameDevice: accountCreationsDevice,
    knownDeviceForEmail,
  };
}

export async function isDeviceBlocked(deviceFingerprint: string | null): Promise<boolean> {
  if (!deviceFingerprint?.trim()) return false;
  const res = await query<{ n: number }>(
    `SELECT 1 as n FROM blocked_devices WHERE device_fingerprint = $1 LIMIT 1`,
    [deviceFingerprint.trim()]
  );
  return res.rows.length > 0;
}

export async function blockDevice(fingerprint: string, reason?: string): Promise<void> {
  await query(
    `INSERT INTO blocked_devices (device_fingerprint, reason) VALUES ($1, $2)
     ON CONFLICT (device_fingerprint) DO UPDATE SET reason = EXCLUDED.reason`,
    [fingerprint, reason ?? null]
  );
}

export async function unblockDevice(fingerprint: string): Promise<void> {
  await query(`DELETE FROM blocked_devices WHERE device_fingerprint = $1`, [fingerprint]);
}
