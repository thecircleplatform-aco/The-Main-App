/**
 * Suspicious behavior detection for login and signup.
 * Runs before auth logic; calculates risk score and may require CAPTCHA or block.
 */

import { getClientIP } from "@/auth/utils/ipUtils";
import { getDeviceFingerprintFromRequest } from "@/auth/utils/deviceFingerprint";
import {
  getRiskCounts,
  insertAuthEvent,
  isDeviceBlocked,
  type AuthEventType,
} from "@/auth/services/authEventsService";

const RISK_FAILED_LOGINS = 25;
const RISK_MULTIPLE_ACCOUNTS_DEVICE = 35;
const RISK_SIGNUP_BURST_IP = 20;
const RISK_UNKNOWN_DEVICE = 10;

const THRESHOLD_CAPTCHA = 60;
const THRESHOLD_BLOCK = 80;

export type SuspiciousBehaviorInput = {
  request: Request;
  eventType: AuthEventType;
  email?: string | null;
  deviceFingerprintFromBody?: string | null;
  userId?: string | null;
};

export type SuspiciousBehaviorResult = {
  allowed: true;
  riskScore: number;
  requiresCaptcha: boolean;
  eventId?: string;
} | {
  allowed: false;
  riskScore: number;
  reason: "blocked_high_risk" | "device_blocked";
  eventId?: string;
};

/**
 * Evaluate suspicious behavior and compute risk score (0–100).
 * Runs in under ~10ms with minimal DB queries.
 * - 0–30 normal, 30–60 suspicious, 60–100 high risk.
 * If risk > 80: block. If risk > 60: require CAPTCHA (caller handles response).
 */
export async function evaluateSuspiciousBehavior(
  input: SuspiciousBehaviorInput
): Promise<SuspiciousBehaviorResult> {
  const ip = getClientIP(input.request) ?? "unknown";
  const deviceFingerprint =
    input.deviceFingerprintFromBody?.trim() ||
    getDeviceFingerprintFromRequest(input.request) ||
    null;

  const blocked = await isDeviceBlocked(deviceFingerprint);
  if (blocked) {
    return {
      allowed: false,
      riskScore: 100,
      reason: "device_blocked",
    };
  }

  const counts = await getRiskCounts({
    ipAddress: ip,
    deviceFingerprint,
    email: input.email ?? null,
    eventType: input.eventType,
  });

  let riskScore = 0;
  const reasons: string[] = [];

  if (counts.failedLoginsSameIp >= 3) {
    riskScore += RISK_FAILED_LOGINS;
    reasons.push("multiple_failed_logins_ip");
  }
  if (counts.accountCreationsSameDevice >= 2) {
    riskScore += RISK_MULTIPLE_ACCOUNTS_DEVICE;
    reasons.push("multiple_accounts_same_device");
  }
  if (counts.signupsSameIp >= 2) {
    riskScore += RISK_SIGNUP_BURST_IP;
    reasons.push("signup_burst_ip");
  }
  if (
    input.eventType === "login_attempt" &&
    input.email &&
    deviceFingerprint &&
    counts.knownDeviceForEmail === 0
  ) {
    riskScore += RISK_UNKNOWN_DEVICE;
    reasons.push("login_unknown_device");
  }

  riskScore = Math.min(100, riskScore);

  const shouldLog = riskScore >= THRESHOLD_CAPTCHA;
  if (shouldLog) {
    await insertAuthEvent({
      userId: input.userId ?? null,
      ipAddress: ip,
      deviceFingerprint,
      eventType: input.eventType,
      riskScore,
      details: { reasons },
    });
  }

  if (riskScore >= THRESHOLD_BLOCK) {
    return {
      allowed: false,
      riskScore,
      reason: "blocked_high_risk",
    };
  }

  return {
    allowed: true,
    riskScore,
    requiresCaptcha: riskScore > THRESHOLD_CAPTCHA,
  };
}

/**
 * Log an auth event (e.g. after successful/failed auth for auditing).
 * Call when risk was below log threshold but you still want to record.
 */
export async function recordAuthEvent(params: {
  request: Request;
  userId: string | null;
  deviceFingerprint: string | null;
  eventType: AuthEventType;
  riskScore: number;
  details?: Record<string, unknown>;
}): Promise<void> {
  const ip = getClientIP(params.request) ?? "unknown";
  await insertAuthEvent({
    userId: params.userId,
    ipAddress: ip,
    deviceFingerprint: params.deviceFingerprint,
    eventType: params.eventType,
    riskScore: params.riskScore,
    details: params.details,
  });
}

/** Legacy export for compatibility. */
export type SuspiciousEvent = {
  type: "failed_login" | "repeated_failures" | "new_device" | "unusual_location";
  userId?: string;
  ip?: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
};

export async function recordSuspiciousEvent(event: SuspiciousEvent): Promise<void> {
  await insertAuthEvent({
    userId: event.userId ?? null,
    ipAddress: event.ip ?? "unknown",
    deviceFingerprint: event.deviceId ?? null,
    eventType: "login_attempt",
    riskScore: 50,
    details: event.metadata ?? {},
  });
}
