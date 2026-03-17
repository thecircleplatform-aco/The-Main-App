import { NextResponse } from "next/server";
import { z } from "zod";
import { validateOtp } from "@/auth/services/otpService";
import { loginByPhoneOrCreate } from "@/auth/services/authService";
import { getClientIP } from "@/auth/utils/ipUtils";
import { evaluateSuspiciousBehavior } from "@/auth/middleware/suspiciousBehavior";
import { insertAuthEvent } from "@/auth/services/authEventsService";
import { configErrorResponse } from "@/config/configError";

const bodySchema = z.object({
  phoneNumber: z.string().min(10).max(20),
  otp: z
    .string()
    .min(1)
    .transform((s) => s.replace(/\D/g, "").slice(0, 6))
    .refine((s) => s.length === 6, "OTP must be 6 digits"),
  deviceId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Phone and 6-digit OTP required." },
        { status: 400 }
      );
    }

    const suspicious = await evaluateSuspiciousBehavior({
      request,
      eventType: "login_attempt",
      email: null,
      deviceFingerprintFromBody: parsed.data.deviceId ?? null,
    });
    if (!suspicious.allowed) {
      return NextResponse.json(
        {
          error:
            suspicious.reason === "device_blocked"
              ? "This device has been blocked. Contact support."
              : "Request blocked due to security. Try again later.",
        },
        { status: 403 }
      );
    }
    if (suspicious.requiresCaptcha) {
      return NextResponse.json(
        { error: "Security check required. Please try again.", captchaRequired: true },
        { status: 403 }
      );
    }

    const validateResult = await validateOtp(
      parsed.data.phoneNumber,
      parsed.data.otp
    );

    if (!validateResult.ok) {
      const ip = getClientIP(request) ?? "unknown";
      await insertAuthEvent({
        userId: null,
        ipAddress: ip,
        deviceFingerprint: parsed.data.deviceId ?? null,
        eventType: "login_attempt",
        riskScore: suspicious.riskScore,
        details: { phone: true, otpFailed: true },
      }).catch(() => {});
      return NextResponse.json(
        { error: validateResult.error },
        { status: 400 }
      );
    }

    const loginResult = await loginByPhoneOrCreate(
      parsed.data.phoneNumber,
      request,
      parsed.data.deviceId ?? null
    );

    if (!loginResult.success) {
      return NextResponse.json(
        { error: loginResult.error },
        { status: loginResult.status }
      );
    }

    return NextResponse.json({ user: loginResult.user });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
