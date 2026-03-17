import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { storeOtp } from "@/auth/services/otpService";
import { getClientIP } from "@/auth/utils/ipUtils";
import { evaluateSuspiciousBehavior } from "@/auth/middleware/suspiciousBehavior";
import { configErrorResponse } from "@/config/configError";

const bodySchema = z.object({
  phoneNumber: z.string().min(10).max(20),
});

const MAX_SEND_OTP_PER_IP_PER_HOUR = 15;

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request) ?? "unknown";

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const ipCount = await query<{ count: string }>(
      `SELECT count(*)::text as count FROM phone_otp_requests
       WHERE ip_address = $1 AND created_at > $2`,
      [ip, hourAgo]
    );
    const count = parseInt(ipCount.rows[0]?.count ?? "0", 10);
    if (count >= MAX_SEND_OTP_PER_IP_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid phone number." },
        { status: 400 }
      );
    }

    const suspicious = await evaluateSuspiciousBehavior({
      request,
      eventType: "login_attempt",
      email: null,
      deviceFingerprintFromBody: body.deviceId ?? null,
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

    const result = await storeOtp(parsed.data.phoneNumber, ip);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        result.error.includes("hour") ? { status: 429 } : { status: 400 }
      );
    }

    const isDev = process.env.NODE_ENV !== "production";
    const res: { ok: true; expiresInSeconds: number; otp?: string } = {
      ok: true,
      expiresInSeconds: 5 * 60,
    };
    if (isDev) {
      res.otp = result.otpCode;
    }

    return NextResponse.json(res);
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
