import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireCircleModerator } from "@/lib/circle-admin-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/circle-messages/delete
 * Body: { messageId }
 * Only moderators or admins can delete messages.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const messageId =
      typeof body?.messageId === "string" ? body.messageId.trim() : "";

    if (!messageId) {
      return NextResponse.json(
        { error: "Invalid or missing messageId" },
        { status: 400 }
      );
    }

    const msgRes = await query<{ circle_id: string }>(
      "SELECT circle_id FROM circle_messages WHERE id = $1",
      [messageId]
    );
    const msg = msgRes.rows[0];
    if (!msg) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const circleRes = await query<{ slug: string }>(
      "SELECT slug FROM circles WHERE id = $1",
      [msg.circle_id]
    );
    const circleSlug = circleRes.rows[0]?.slug;
    if (!circleSlug) {
      return NextResponse.json(
        { error: "Circle not found" },
        { status: 404 }
      );
    }

    const modResult = await requireCircleModerator(circleSlug);
    if ("response" in modResult) {
      return modResult.response;
    }

    await query("DELETE FROM circle_messages WHERE id = $1", [messageId]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/circle-messages/delete error:", e);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
