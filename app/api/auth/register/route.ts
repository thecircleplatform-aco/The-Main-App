import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { configErrorResponse } from "@/lib/configError";
import { getClientIp } from "@/lib/request-utils";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(120).optional(),
  deviceFingerprint: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e: { message: string }) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { email, password, name, deviceFingerprint } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const ip = getClientIp(request);

    if (deviceFingerprint) {
      const existingDevice = await query<{ user_id: string }>(
        "SELECT user_id FROM devices WHERE device_fingerprint = $1",
        [deviceFingerprint]
      ).catch(() => ({ rows: [] }));
      if (existingDevice.rows.length > 0) {
        return NextResponse.json(
          { error: "Only one account is allowed per device." },
          { status: 403 }
        );
      }

      const abuseCount = await query<{ count: string }>(
        `SELECT count(*)::text as count FROM account_creation_logs
         WHERE device_fingerprint = $1 AND created_at > now() - interval '30 days'`,
        [deviceFingerprint]
      ).catch(() => ({ rows: [{ count: "0" }] }));
      const count = parseInt(abuseCount.rows[0]?.count ?? "0", 10);
      if (count >= 10) {
        return NextResponse.json(
          {
            error:
              "Your device has exceeded account creation limits. Please contact support if you believe this is a mistake.",
            shadowBanned: true,
          },
          { status: 403 }
        );
      }
    }

    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE lower(email) = $1",
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const insert = await query<{ id: string; email: string; name: string | null }>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [normalizedEmail, name?.trim() || null, passwordHash]
    );
    const row = insert.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Registration failed." }, { status: 500 });
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

    await createSession({
      sub: row.id,
      email: row.email,
      name: row.name,
    });

    return NextResponse.json({
      user: { id: row.id, email: row.email, name: row.name ?? undefined },
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
