import { NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { query } from "@/database/db";
import { configErrorResponse } from "@/config/configError";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ email: null, name: null, id: null, deletionScheduledAt: null });
    }

    const res = await query<{
      deletion_scheduled_at: string | null;
      status: string | null;
    }>(
      "SELECT deletion_scheduled_at, status FROM users WHERE id = $1",
      [session.sub]
    );
    const row = res.rows[0];
    const deletionScheduledAt = row?.deletion_scheduled_at ?? null;
    const status = row?.status ?? "active";

    if (status === "blocked" || status === "shadow_banned") {
      return NextResponse.json(
        {
          blocked: true,
          status,
          message:
            "Your account has been blocked. If you believe this is a mistake, please contact support.",
        },
        { status: 403 }
      );
    }

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
