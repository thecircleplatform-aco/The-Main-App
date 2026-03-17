import { NextResponse } from "next/server";
import { getSession } from "@/auth/services/sessionService";
import { destroySession } from "@/auth/services/sessionService";
import {
  revokeAllSessionsForUser,
  revokeAllSessionsForUserExcept,
} from "@/auth/services/sessionRecordService";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const includeCurrent = body.includeCurrent !== false;

  if (includeCurrent) {
    await revokeAllSessionsForUser(session.sub);
    await destroySession();
    const url = new URL(request.url);
    const signoutUrl = `${url.origin}/api/auth/signout?callbackUrl=${encodeURIComponent(url.origin + "/login")}`;
    return NextResponse.json({ ok: true, signoutUrl });
  }

  const exceptId = session.sessionId ?? "";
  if (exceptId) {
    await revokeAllSessionsForUserExcept(session.sub, exceptId);
  }
  return NextResponse.json({ ok: true });
}
