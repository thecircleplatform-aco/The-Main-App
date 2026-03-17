import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";

export const dynamic = "force-dynamic";

type Body =
  | { notificationId: string; all?: false }
  | { all: true; notificationId?: undefined };

/**
 * POST /api/notifications/read
 * Body: { notificationId } OR { all: true }
 * Marks one or all notifications as read for the current user.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.sub;

    const body = (await request.json().catch(() => ({}))) as Partial<Body>;

    if (body.all) {
      await query(
        `UPDATE notifications
         SET is_read = true
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      return NextResponse.json({ success: true });
    }

    const notificationId =
      typeof body.notificationId === "string"
        ? body.notificationId.trim()
        : "";
    if (!notificationId) {
      return NextResponse.json(
        { error: "Invalid or missing notificationId" },
        { status: 400 }
      );
    }

    await query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/notifications/read error:", e);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

