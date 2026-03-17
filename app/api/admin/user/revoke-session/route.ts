import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import {
  revokeSession,
  incrementSessionVersion,
} from "@/auth/services/sessionRecordService";
import { configErrorResponse } from "@/config/configError";

const bodySchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { userId, sessionId } = parsed.data;

    const row = await query<{ user_id: string }>(
      `SELECT user_id FROM user_sessions WHERE id = $1`,
      [sessionId]
    );
    if (row.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (row.rows[0].user_id !== userId) {
      return NextResponse.json({ error: "Session does not belong to user" }, { status: 403 });
    }

    await revokeSession(sessionId);
    await incrementSessionVersion(userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
