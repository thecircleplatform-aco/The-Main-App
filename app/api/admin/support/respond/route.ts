import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";
import { getClientIp } from "@/lib/request-utils";

const bodySchema = z.object({
  ticketId: z.string().uuid(),
  responseMessage: z.string().min(1).max(2000),
  unblockUser: z.boolean().optional(),
  unblockEmail: z.string().email().optional(),
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

    const { ticketId, responseMessage, unblockUser, unblockEmail } = parsed.data;

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

    let userIdToUnblock: string | null = ticket.user_id;
    if (unblockUser && !userIdToUnblock && unblockEmail) {
      const userRes = await query<{ id: string }>(
        `SELECT id FROM users WHERE lower(email) = lower($1)`,
        [unblockEmail.trim()]
      );
      userIdToUnblock = userRes.rows[0]?.id ?? null;
      if (!userIdToUnblock) {
        return NextResponse.json(
          { error: `No user found with email ${unblockEmail}` },
          { status: 404 }
        );
      }
    }

    if (unblockUser && userIdToUnblock) {
      try {
        await query(
          `UPDATE users SET status = 'active' WHERE id = $1`,
          [userIdToUnblock]
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("status") && msg.includes("does not exist")) {
          return NextResponse.json(
            { error: "Database migration required. Run: npm run db:migrate" },
            { status: 503 }
          );
        }
        throw err;
      }
    } else if (unblockUser && !userIdToUnblock) {
      return NextResponse.json(
        { error: "Cannot unblock: no user linked to this ticket. Ask the user to submit a new ticket while logged in, or enter their email below." },
        { status: 400 }
      );
    }

    try {
      const ip = getClientIp(request);
      await query(
        `INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auth.admin.sub,
          "support_respond",
          "support_ticket",
          ticketId,
          JSON.stringify({ unblockUser: unblockUser ?? false, userId: userIdToUnblock }),
          ip,
        ]
      );
    } catch {
      // admin_action_logs may not exist; don't fail the request
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
