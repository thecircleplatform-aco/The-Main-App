import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { configErrorResponse } from "@/lib/configError";
import { getClientIp } from "@/lib/request-utils";

const bodySchema = z.object({
  userId: z.string().uuid(),
  shadowBan: z.boolean(),
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

    const { userId, shadowBan } = parsed.data;

    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newStatus = shadowBan ? "shadow_banned" : "active";

    await query(`UPDATE users SET status = $1 WHERE id = $2`, [newStatus, userId]);

    const ip = getClientIp(request);
    await query(
      `INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auth.admin.sub,
        shadowBan ? "user_shadow_ban" : "user_shadow_unban",
        "user",
        userId,
        JSON.stringify({ shadowBan }),
        ip,
      ]
    );

    return NextResponse.json({
      ok: true,
      message: shadowBan ? "User shadow banned" : "User un-shadow-banned",
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
