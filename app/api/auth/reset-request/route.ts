import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { getClientIP } from "@/auth/utils/ipUtils";
import {
  createResetToken,
  checkResetRequestRateLimit,
  recordResetRequestEvent,
} from "@/auth/services/passwordResetService";
import { sendPasswordResetEmail } from "@/auth/utils/email";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
});

const RATE_LIMIT_MESSAGE =
  "Too many reset requests. Please try again in an hour.";

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request) ?? "unknown";
    const limit = await checkResetRequestRateLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await query<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = $1`,
      [email]
    );

    await recordResetRequestEvent(ip);

    if (user.rows.length > 0) {
      const userId = user.rows[0].id;
      const token = await createResetToken(userId);
      const origin = new URL(request.url).origin;
      const resetLink = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(email, resetLink);
    }

    return NextResponse.json({
      message:
        "If an account exists with this email, you will receive a password reset link shortly.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
