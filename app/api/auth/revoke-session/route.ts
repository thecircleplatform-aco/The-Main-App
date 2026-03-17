import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/auth/services/sessionService";
import { destroySession } from "@/auth/services/sessionService";
import { revokeSession } from "@/auth/services/sessionRecordService";
import { query } from "@/database/db";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const { sessionId } = parsed.data;

  const owned = await query<{ user_id: string }>(
    `SELECT user_id FROM user_sessions WHERE id = $1`,
    [sessionId]
  );
  if (owned.rows.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (owned.rows[0].user_id !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await revokeSession(sessionId);

  if (session.sessionId === sessionId) {
    await destroySession();
    const url = new URL(request.url);
    const origin = url.origin;
    const signoutUrl = `${origin}/api/auth/signout?callbackUrl=${encodeURIComponent(origin + "/login")}`;
    return NextResponse.json({
      ok: true,
      revoked: "current",
      signoutUrl,
    });
  }

  return NextResponse.json({ ok: true, revoked: "other" });
}
