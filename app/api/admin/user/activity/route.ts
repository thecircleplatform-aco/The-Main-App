import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { configErrorResponse } from "@/lib/configError";

const querySchema = z.object({
  userId: z.string().uuid(),
});

type SessionRow = { id: string; created_at: string };
type IpRow = { ip_address: string; device_id: string | null; created_at: string };
type TicketRow = { id: string; message: string; status: string; created_at: string };

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

    const [sessionsRes, ipsRes, ticketsRes] = await Promise.all([
      query<SessionRow>(
        `SELECT id, created_at FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      query<IpRow>(
        `SELECT ip_address, device_id, created_at FROM user_ips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      query<TicketRow>(
        `SELECT id, message, status, created_at FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [userId]
      ),
    ]);

    return NextResponse.json({
      sessions: sessionsRes.rows,
      ipHistory: ipsRes.rows,
      supportTickets: ticketsRes.rows,
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
