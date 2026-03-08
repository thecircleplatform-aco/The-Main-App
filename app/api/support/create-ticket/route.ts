import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { configErrorResponse } from "@/lib/configError";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  userId: z.string().uuid().optional(),
});

/** Create a support ticket. Called by blocked/shadow-banned users. userId optional if not logged in. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { message, userId } = parsed.data;

    const insert = await query<{ id: string }>(
      `INSERT INTO support_tickets (user_id, message, status)
       VALUES ($1, $2, 'open')
       RETURNING id`,
      [userId ?? null, message]
    );

    const row = insert.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ticketId: row.id });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
