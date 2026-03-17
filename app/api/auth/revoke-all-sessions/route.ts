import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/auth/services/sessionService";
import {
  revokeAllSessionsForUser,
  incrementSessionVersion,
} from "@/auth/services/sessionRecordService";

/** Revoke all sessions for the current user, invalidate all tokens (session_version), and sign out. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await revokeAllSessionsForUser(session.sub);
  await incrementSessionVersion(session.sub);
  await destroySession();
  const url = new URL(request.url);
  const origin = url.origin;
  const signoutUrl = `${origin}/api/auth/signout?callbackUrl=${encodeURIComponent(origin + "/login")}`;
  return NextResponse.json({ ok: true, signoutUrl });
}
