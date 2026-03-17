import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";
import { getClientIP } from "@/auth/utils/ipUtils";
import { blockDevice } from "@/auth/services/authEventsService";

const bodySchema = z.object({
  action: z.enum(["flag", "block", "shadow_ban_device"]),
  userId: z.string().uuid().optional(),
  deviceFingerprint: z.string().min(1).optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { action, userId, deviceFingerprint, reason } = parsed.data;
    const ip = getClientIP(request) ?? "unknown";

    if (action === "flag") {
      if (!userId) {
        return NextResponse.json({ error: "userId required for flag action" }, { status: 400 });
      }
      await query(
        `INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [auth.admin.sub, "user_flagged", "user", userId, JSON.stringify({ reason: reason ?? "Suspicious activity" }), ip]
      );
      return NextResponse.json({ ok: true, message: "Account flagged for review" });
    }

    if (action === "block") {
      if (!userId) {
        return NextResponse.json({ error: "userId required for block action" }, { status: 400 });
      }
      const existing = await query<{ id: string; status: string }>(
        "SELECT id, status FROM users WHERE id = $1",
        [userId]
      );
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      await query(`UPDATE users SET status = $1 WHERE id = $2`, ["blocked", userId]);
      await query(
        `INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auth.admin.sub,
          "user_block",
          "user",
          userId,
          JSON.stringify({ previousStatus: existing.rows[0].status, reason: reason ?? "Suspicious activity" }),
          ip,
        ]
      );
      return NextResponse.json({ ok: true, message: "User blocked" });
    }

    if (action === "shadow_ban_device") {
      if (!deviceFingerprint?.trim()) {
        return NextResponse.json({ error: "deviceFingerprint required for shadow_ban_device action" }, { status: 400 });
      }
      await blockDevice(deviceFingerprint.trim(), reason ?? "Suspicious activity");
      await query(
        `INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auth.admin.sub,
          "device_shadow_ban",
          "device",
          deviceFingerprint.trim(),
          JSON.stringify({ reason: reason ?? "Suspicious activity" }),
          ip,
        ]
      );
      return NextResponse.json({ ok: true, message: "Device shadow banned" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
