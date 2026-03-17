import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireCircleAdmin } from "@/lib/circle-admin-auth";
import { notifyCircleUpdate } from "@/lib/circle-updates-notify";
import { createCircleBroadcastNotification } from "@/lib/circle-notifications";

export const dynamic = "force-dynamic";

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

/**
 * POST /api/circle-updates/create
 * Body: { circleSlug, title, content }
 * Only circle admins (or super admins) can post.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const circleSlug =
      typeof body?.circleSlug === "string" ? body.circleSlug.trim() : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!circleSlug || !isValidSlug(circleSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing circleSlug" },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const adminResult = await requireCircleAdmin(circleSlug);
    if ("response" in adminResult) {
      return adminResult.response;
    }
    const { info } = adminResult;

    const insertRes = await query<{
      id: string;
      circle_id: string;
      title: string;
      content: string;
      created_by: string;
      created_at: string;
    }>(
      `INSERT INTO circle_updates (circle_id, title, content, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, circle_id, title, content, created_by, created_at`,
      [info.circleId, title, content, info.userId]
    );
    const row = insertRes.rows[0];
    if (!row) {
      return NextResponse.json(
        { error: "Failed to create update" },
        { status: 500 }
      );
    }

    await notifyCircleUpdate(info.circleId, info.circleName, title);
    await createCircleBroadcastNotification({
      circleId: info.circleId,
      type: "circle_update",
      title: `New update in ${info.circleName} Circle`,
      content: title,
    });

    return NextResponse.json({
      success: true,
      update: {
        id: row.id,
        circle_id: row.circle_id,
        title: row.title,
        content: row.content,
        created_by: row.created_by,
        created_at: row.created_at,
      },
    });
  } catch (e) {
    console.error("POST /api/circle-updates/create error:", e);
    return NextResponse.json(
      { error: "Failed to create update" },
      { status: 500 }
    );
  }
}
