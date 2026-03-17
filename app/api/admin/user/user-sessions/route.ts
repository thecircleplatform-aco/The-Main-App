import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";
import { query } from "@/database/db";

const querySchema = z.object({
  userId: z.string().uuid(),
});

type UserSessionRow = {
  id: string;
  device_name: string | null;
  ip_address: string | null;
  created_at: string;
  last_active: string;
  revoked: boolean;
};

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({ userId: searchParams.get("userId") });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    let rows: UserSessionRow[] = [];
    try {
      const res = await query<UserSessionRow>(
        `SELECT id, device_name, ip_address, created_at, last_active, revoked
         FROM user_sessions
         WHERE user_id = $1
         ORDER BY last_active DESC
         LIMIT 100`,
        [parsed.data.userId]
      );
      rows = res.rows;
    } catch {
      // user_sessions table may not exist yet
    }

    return NextResponse.json({
      sessions: rows.map((r) => ({
        id: r.id,
        deviceName: r.device_name ?? "Unknown",
        ipAddress: r.ip_address ?? undefined,
        createdAt: r.created_at,
        lastActive: r.last_active,
        revoked: r.revoked,
      })),
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
