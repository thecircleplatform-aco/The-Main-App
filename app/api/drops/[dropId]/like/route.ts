import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/drops/[dropId]/like
 * Toggle like for the current user. Returns { liked: boolean, likesCount: number }.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dropId } = await params;
    if (!dropId) {
      return NextResponse.json({ error: "Missing drop ID" }, { status: 400 });
    }

    const exists = await query<{ id: string }>(
      "SELECT id FROM drops WHERE id = $1",
      [dropId]
    );
    if (!exists.rows?.length) {
      return NextResponse.json({ error: "Drop not found" }, { status: 404 });
    }

    const current = await query<{ drop_id: string }>(
      "SELECT drop_id FROM drop_likes WHERE drop_id = $1 AND user_id = $2",
      [dropId, session.sub]
    );
    const isLiked = (current.rows?.length ?? 0) > 0;

    if (isLiked) {
      await query(
        "DELETE FROM drop_likes WHERE drop_id = $1 AND user_id = $2",
        [dropId, session.sub]
      );
    } else {
      await query(
        "INSERT INTO drop_likes (drop_id, user_id) VALUES ($1, $2) ON CONFLICT (drop_id, user_id) DO NOTHING",
        [dropId, session.sub]
      );
    }

    const countRes = await query<{ count: string }>(
      "SELECT count(*)::text AS count FROM drop_likes WHERE drop_id = $1",
      [dropId]
    );
    const likesCount = parseInt(countRes.rows?.[0]?.count ?? "0", 10);

    return NextResponse.json({
      liked: !isLiked,
      likesCount,
    });
  } catch (e) {
    console.error("POST /api/drops/[dropId]/like error:", e);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
