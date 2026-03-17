import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { getClientIP } from "@/auth/utils/ipUtils";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
  reason: z.string().min(10, "Please describe your situation in at least 10 characters").max(2000),
});

const RATE_LIMIT_PER_HOUR = 5;

async function checkRecoveryRateLimit(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000);
  const res = await query<{ count: string }>(
    `SELECT count(*)::text as count FROM password_recovery_requests
     WHERE ip_address = $1 AND created_at > $2`,
    [ip, windowStart]
  );
  const count = parseInt(res.rows[0]?.count ?? "0", 10);
  return count < RATE_LIMIT_PER_HOUR;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request) ?? "unknown";
    const allowed = await checkRecoveryRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many recovery requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    await query(
      `INSERT INTO password_recovery_requests (email, reason, status, ip_address) VALUES ($1, $2, 'pending', $3)`,
      [parsed.data.email.trim().toLowerCase(), parsed.data.reason.trim(), ip]
    );

    return NextResponse.json({
      message:
        "Your request has been submitted. An admin will review it and contact you if approved.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
