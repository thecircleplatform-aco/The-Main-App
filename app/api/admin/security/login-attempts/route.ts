import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";

const DEFAULT_LIMIT = 200;

type LoginAttemptRow = {
  id: string;
  ip_address: string;
  email: string;
  success: boolean;
  action: string;
  created_at: string;
};

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      500,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );

    const res = await query<LoginAttemptRow>(
      `SELECT id, ip_address, email, success, action, created_at
       FROM login_attempts
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({
      attempts: res.rows.map((r) => ({
        id: r.id,
        ip_address: r.ip_address,
        email: r.email,
        success: r.success,
        action: r.action,
        created_at: r.created_at,
      })),
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
