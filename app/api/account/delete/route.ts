import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";
import { configErrorResponse } from "@/config/configError";

async function getDemoUserId(): Promise<string> {
  const res = await query<{ id: string }>(
    "SELECT id FROM users ORDER BY created_at ASC LIMIT 1"
  );
  if (!res.rows[0]) {
    throw new Error("No users found");
  }
  return res.rows[0].id;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.sub ?? (await getDemoUserId());

    const body = (await req.json()) as { userId?: string; reason: string };
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO account_deletions (user_id, reason) VALUES ($1, $2)`,
      [userId, reason]
    );

    await query(
      `UPDATE users SET deletion_scheduled_at = now() WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
