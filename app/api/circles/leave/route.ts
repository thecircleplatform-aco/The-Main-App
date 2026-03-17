import { NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { query } from "@/database/db";

export const dynamic = "force-dynamic";

/** Allow only safe slug characters */
function isValidSlug(slug: string): boolean {
  return typeof slug === "string" && /^[a-z0-9-]+$/.test(slug) && slug.length <= 200;
}

/**
 * POST /api/circles/leave
 * Body: { "circleSlug": "bts" }
 * Requires logged-in user. Removes membership and decrements member_count.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.sub;

    const body = await request.json().catch(() => ({}));
    const circleSlug =
      typeof body?.circleSlug === "string" ? body.circleSlug.trim() : "";
    if (!circleSlug || !isValidSlug(circleSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing circleSlug" },
        { status: 400 }
      );
    }

    const circleRes = await query<{ id: string }>(
      "SELECT id FROM circles WHERE slug = $1",
      [circleSlug]
    );
    const circle = circleRes.rows[0];
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const deleteRes = await query(
      "DELETE FROM circle_members WHERE circle_id = $1 AND user_id = $2 RETURNING 1",
      [circle.id, userId]
    );

    if (deleteRes.rowCount && deleteRes.rowCount > 0) {
      await query(
        "UPDATE circles SET member_count = GREATEST(0, member_count - 1), updated_at = now() WHERE id = $1",
        [circle.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/circles/leave error:", e);
    return NextResponse.json(
      { error: "Failed to leave circle" },
      { status: 500 }
    );
  }
}
