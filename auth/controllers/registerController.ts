/**
 * Register: validate body, check rate limit, suspicious behavior, call authService.register, record attempt, return response.
 */

import { NextResponse } from "next/server";
import { validateRegisterBody } from "@/auth/validators/registerValidator";
import { register } from "@/auth/services/authService";
import { configErrorResponse } from "@/config/configError";
import {
  checkRegisterRateLimitByRequest,
  recordLoginAttempt,
} from "@/auth/middleware/rateLimitMiddleware";
import { evaluateSuspiciousBehavior } from "@/auth/middleware/suspiciousBehavior";

const REGISTER_RATE_LIMIT_MESSAGE =
  "Too many registrations from this device. Please try again later.";

const SUSPICIOUS_BLOCK_MESSAGE =
  "Registration temporarily blocked due to suspicious activity. Please try again later or contact support.";
const CAPTCHA_REQUIRED_MESSAGE =
  "Security check required. Please complete the CAPTCHA to continue.";

export async function handleRegister(request: Request): Promise<NextResponse> {
  try {
    const limit = await checkRegisterRateLimitByRequest(request);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: REGISTER_RATE_LIMIT_MESSAGE },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = validateRegisterBody(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const suspicious = await evaluateSuspiciousBehavior({
      request,
      eventType: "signup_attempt",
      email: validation.data.email,
      deviceFingerprintFromBody: validation.data.deviceFingerprint ?? null,
    });
    if (!suspicious.allowed) {
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

    const result = await register(
      {
        email: validation.data.email,
        password: validation.data.password,
        name: validation.data.name,
        deviceFingerprint: validation.data.deviceFingerprint,
        acoCode: validation.data.aco_code,
      },
      request
    );

    await recordLoginAttempt({
      request,
      email: validation.data.email.trim().toLowerCase(),
      success: result.success,
      action: "register",
    });

    if (!result.success) {
      const res: Record<string, unknown> = { error: result.error };
      if (result.status === 403 && result.error.includes("account creation limits")) {
        res.shadowBanned = true;
      }
      const status = result.status === 400 ? 400 : result.status;
      return NextResponse.json(res, { status });
    }

    return NextResponse.json({ user: result.user });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
