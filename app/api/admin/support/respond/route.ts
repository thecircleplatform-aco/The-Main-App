import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { configErrorResponse } from "@/lib/configError";
import { getClientIp } from "@/lib/request-utils";

const bodySchema = z.object({
  ticketId: z.string().uuid(),
  responseMessage: z.string().min(1).max(2000),
  unblockUser: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ")
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { ticketId, responseMessage, unblockUser } = parsed.data;

    const ticketRes = await query<{ id: string; user_id: string | null }>(
      `SELECT id, user_id FROM support_tickets WHERE id = $1`,
      [ticketId]
    );
    const ticket = ticketRes.rows[0];
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await query(
      `UPDATE support_tickets
       SET admin_response = $1, status = 'resolved', updated_at = now(),
           unblocked_at = CASE WHEN $2 THEN now() ELSE unblocked_at END
       WHERE id = $3`,
      [responseMessage, unblockUser ?? false, ticketId]
    );

    if (unblockUser && ticket.user_id) {
      await query(
        `UPDATE users SET status = 'active' WHERE id = $1`,
        [ticket.user_id]
      );
    }

    const ip = getClientIp(request);
    await query(
      `INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auth.admin.sub,
        "support_respond",
        "support_ticket",
        ticketId,
        JSON.stringify({ unblockUser: unblockUser ?? false, userId: ticket.user_id }),
        ip,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
