import { NextResponse } from "next/server";
import { getSession } from "@/auth/services/sessionService";
import { revokeAllSessionsForUserExcept } from "@/auth/services/sessionRecordService";

/** Revoke all sessions for the current user except the current one. */
export async function POST() {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.sessionId) {
    return NextResponse.json(
      { error: "Current session not tracked; no other sessions to revoke." },
      { status: 400 }
    );
  }
  await revokeAllSessionsForUserExcept(session.sub, session.sessionId);
  return NextResponse.json({ ok: true });
}
