/**
 * Login: validate body, check rate limit, suspicious behavior, call authService.login, record attempt, return response.
 */

import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { validateLoginBody } from "@/auth/validators/loginValidator";
import { login } from "@/auth/services/authService";
import {
  revokeAllSessionsForUser,
  incrementSessionVersion,
} from "@/auth/services/sessionRecordService";
import { configErrorResponse } from "@/config/configError";
import {
  checkLoginRateLimitByRequest,
  recordLoginAttempt,
} from "@/auth/middleware/rateLimitMiddleware";
import { evaluateSuspiciousBehavior } from "@/auth/middleware/suspiciousBehavior";

const RATE_LIMIT_MESSAGE =
  "Too many login attempts. Please wait before trying again.";

const SUSPICIOUS_BLOCK_MESSAGE =
  "Authentication temporarily blocked due to suspicious activity. Please try again later or contact support.";
const CAPTCHA_REQUIRED_MESSAGE =
  "Security check required. Please complete the CAPTCHA to continue.";

export async function handleLogin(request: Request): Promise<NextResponse> {
  try {
    const limit = await checkLoginRateLimitByRequest(request);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        {
          status: 429,
          headers:
            limit.retryAfterSeconds != null
              ? { "Retry-After": String(limit.retryAfterSeconds) }
              : undefined,
        }
      );
    }

    const body = await request.json();
    const validation = validateLoginBody(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const suspicious = await evaluateSuspiciousBehavior({
      request,
      eventType: "login_attempt",
      email: validation.data.email,
      deviceFingerprintFromBody: validation.data.deviceId ?? null,
    });
    if (!suspicious.allowed) {
      const normalizedEmail = validation.data.email.trim().toLowerCase();
      const userRow = await query<{ id: string }>(
        "SELECT id FROM users WHERE lower(email) = $1",
        [normalizedEmail]
      ).catch(() => ({ rows: [] }));
      if (userRow.rows[0]?.id) {
        const uid = userRow.rows[0].id;
        await revokeAllSessionsForUser(uid).catch(() => {});
        await incrementSessionVersion(uid).catch(() => {});
      }
      return NextResponse.json(
        {
          error:
            suspicious.reason === "device_blocked"
              ? "This device has been blocked. Contact support."
              : SUSPICIOUS_BLOCK_MESSAGE,
          blocked: true,
        },
        { status: 403 }
      );
    }
    if (suspicious.requiresCaptcha) {
      return NextResponse.json(
        { error: CAPTCHA_REQUIRED_MESSAGE, captchaRequired: true },
        { status: 403 }
      );
    }

    const result = await login(
      {
        email: validation.data.email,
        password: validation.data.password,
        deviceId: validation.data.deviceId,
      },
      request
    );

    await recordLoginAttempt({
      request,
      email: validation.data.email.trim().toLowerCase(),
      success: result.success,
      action: "login",
    });

    if (!result.success) {
      const res: Record<string, unknown> = { error: result.error };
      if (result.status === 403 && result.error.includes("blocked")) {
        res.blocked = true;
      }
      return NextResponse.json(res, { status: result.status });
    }

    return NextResponse.json({ user: result.user });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
