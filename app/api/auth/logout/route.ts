import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/auth/services/sessionService";
import { revokeSession } from "@/auth/services/sessionRecordService";

/** Revokes current session in DB (if tracked), clears circle_session cookie. Returns signoutUrl so client can redirect and clear NextAuth (Google) session. */
export async function POST(request: Request) {
  const session = await getSession();
  if (session?.sessionId) {
    await revokeSession(session.sessionId);
  }
  await destroySession();
  const url = new URL(request.url);
  const origin = url.origin;
  const signoutUrl = `${origin}/api/auth/signout?callbackUrl=${encodeURIComponent(origin + "/login")}`;
  return NextResponse.json({ ok: true, signoutUrl });
}
