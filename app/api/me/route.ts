import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { configErrorResponse } from "@/lib/configError";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ email: null, name: null, id: null, deletionScheduledAt: null });
    }

    const res = await query<{ deletion_scheduled_at: string | null }>(
      "SELECT deletion_scheduled_at FROM users WHERE id = $1",
      [session.sub]
    );
    const deletionScheduledAt = res.rows[0]?.deletion_scheduled_at ?? null;

    return NextResponse.json({
      id: session.sub,
      email: session.email,
      name: session.name ?? undefined,
      deletionScheduledAt,
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    return NextResponse.json({ email: null, name: null, id: null, deletionScheduledAt: null });
  }
}
