import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { configErrorResponse } from "@/lib/configError";

type TicketRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const res = await query<TicketRow>(
      `SELECT t.id, t.user_id, u.email as user_email, u.name as user_name,
              t.message, t.status, t.admin_response, t.created_at, t.updated_at
       FROM support_tickets t
       LEFT JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC
       LIMIT 200`
    );

    return NextResponse.json({ tickets: res.rows });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
