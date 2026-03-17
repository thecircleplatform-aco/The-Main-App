import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";

const DEFAULT_LIMIT = 100;
const MIN_RISK_FILTER = 30;

type AuthEventRow = {
  id: string;
  user_id: string | null;
  ip_address: string;
  device_fingerprint: string | null;
  event_type: string;
  risk_score: number;
  details: string | null;
  created_at: string;
  email: string | null;
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
    const minRisk = Math.max(0, Math.min(100, parseInt(searchParams.get("minRisk") ?? String(MIN_RISK_FILTER), 10) || MIN_RISK_FILTER));

    const res = await query<AuthEventRow>(
      `SELECT e.id, e.user_id, e.ip_address, e.device_fingerprint, e.event_type, e.risk_score, e.details, e.created_at,
              u.email
       FROM auth_events e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.risk_score >= $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      [minRisk, limit]
    );

    return NextResponse.json({
      events: res.rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        ip_address: r.ip_address,
        device_fingerprint: r.device_fingerprint,
        event_type: r.event_type,
        risk_score: r.risk_score,
        details: r.details ? (JSON.parse(r.details) as Record<string, unknown>) : {},
        created_at: r.created_at,
        email: r.email,
      })),
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
