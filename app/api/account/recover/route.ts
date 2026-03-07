import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { configErrorResponse } from "@/lib/configError";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to recover your account." },
        { status: 401 }
      );
    }

    const res = await query(
      `UPDATE users SET deletion_scheduled_at = NULL WHERE id = $1 AND deletion_scheduled_at IS NOT NULL RETURNING id`,
      [session.sub]
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: "Account is not scheduled for deletion or already recovered." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
