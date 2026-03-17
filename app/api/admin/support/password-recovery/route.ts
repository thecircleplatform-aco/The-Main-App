import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";

type Row = {
  id: string;
  email: string;
  reason: string;
  status: string;
  ip_address: string | null;
  created_at: string;
};

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const res = await query<Row>(
      `SELECT id, email, reason, status, ip_address, created_at
       FROM password_recovery_requests
       ORDER BY created_at DESC
       LIMIT 200`
    );
    return NextResponse.json({ requests: res.rows });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
