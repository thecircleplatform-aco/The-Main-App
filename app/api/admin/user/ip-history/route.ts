import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";

const querySchema = z.object({
  userId: z.string().uuid(),
});

type IpRow = {
  id: string;
  ip_address: string;
  device_id: string | null;
  created_at: string;
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

    const { userId } = parsed.data;

    let rows: IpRow[] = [];
    try {
      const res = await query<IpRow>(
        `SELECT id, ip_address, device_id, created_at
         FROM user_ips
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [userId]
      );
      rows = res.rows;
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      if (msg.includes("does not exist") || msg.includes("relation")) {
        return NextResponse.json({ ips: [] });
      }
      throw dbErr;
    }

    return NextResponse.json({ ips: rows });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
