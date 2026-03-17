import { NextResponse } from "next/server";

/** Used by Fly.io (and other platforms) for HTTP health checks. */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
