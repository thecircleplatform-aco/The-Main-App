import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireCircleAdmin } from "@/lib/circle-admin-auth";

export const dynamic = "force-dynamic";

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

/**
 * POST /api/circle-members/ban
 * Body: { circleSlug, userId }
 * Only circle admins. Removes user from circle_members and adds to circle_bans.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const circleSlug =
      typeof body?.circleSlug === "string" ? body.circleSlug.trim() : "";
    const targetUserId =
      typeof body?.userId === "string" ? body.userId.trim() : "";

    if (!circleSlug || !isValidSlug(circleSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing circleSlug" },
        { status: 400 }
      );
    }
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Invalid or missing userId" },
        { status: 400 }
      );
    }

    const adminResult = await requireCircleAdmin(circleSlug);
    if ("response" in adminResult) {
      return adminResult.response;
    }
    const { info } = adminResult;

    if (targetUserId === info.userId) {
      return NextResponse.json(
        { error: "You cannot ban yourself" },
        { status: 400 }
      );
    }

    await query(
      "DELETE FROM circle_members WHERE circle_id = $1 AND user_id = $2",
      [info.circleId, targetUserId]
    );

    await query(
      `INSERT INTO circle_bans (circle_id, user_id) VALUES ($1, $2)
       ON CONFLICT (circle_id, user_id) DO NOTHING`,
      [info.circleId, targetUserId]
    );

    await query(
      "UPDATE circles SET member_count = GREATEST(0, member_count - 1), updated_at = now() WHERE id = $1",
      [info.circleId]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/circle-members/ban error:", e);
    return NextResponse.json(
      { error: "Failed to ban user" },
      { status: 500 }
    );
  }
}
