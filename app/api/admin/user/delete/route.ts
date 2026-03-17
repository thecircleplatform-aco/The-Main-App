import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";
import { getClientIp } from "@/lib/request-utils";

const bodySchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const { userId } = parsed.data;

    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await query("DELETE FROM users WHERE id = $1", [userId]);

    const ip = getClientIp(request);
    await query(
      `INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [auth.admin.sub, "user_delete", "user", userId, ip]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
