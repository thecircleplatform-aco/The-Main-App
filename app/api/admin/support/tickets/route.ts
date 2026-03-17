import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";

type TicketRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  submitter_email: string | null;
  submitter_name: string | null;
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
    let res: { rows: TicketRow[] };
    try {
      res = await query<TicketRow>(
        `SELECT t.id, t.user_id,
                COALESCE(u.email, t.submitter_email) as user_email,
                COALESCE(u.name, t.submitter_name) as user_name,
                t.submitter_email, t.submitter_name,
                t.message, t.status, t.admin_response, t.created_at, t.updated_at
         FROM support_tickets t
         LEFT JOIN users u ON u.id = t.user_id
         ORDER BY t.created_at DESC
         LIMIT 200`
      );
    } catch {
      res = await query<TicketRow>(
        `SELECT t.id, t.user_id, u.email as user_email, u.name as user_name,
                null::text as submitter_email, null::text as submitter_name,
                t.message, t.status, t.admin_response, t.created_at, t.updated_at
         FROM support_tickets t
         LEFT JOIN users u ON u.id = t.user_id
         ORDER BY t.created_at DESC
         LIMIT 200`
      );
    }

    return NextResponse.json({ tickets: res.rows });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
