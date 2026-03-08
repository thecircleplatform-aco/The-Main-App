import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { configErrorResponse } from "@/lib/configError";

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

    const res = await query<IpRow>(
      `SELECT id, ip_address, device_id, created_at
       FROM user_ips
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    return NextResponse.json({ ips: res.rows });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
