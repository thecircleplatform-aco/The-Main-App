import { NextResponse } from "next/server";
import { query } from "@/database/db";

export const dynamic = "force-dynamic";

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

type Row = {
  id: string;
  circle_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  author_name: string | null;
};

/**
 * GET /api/circle-updates/list?circleSlug=ronaldo
 * Returns latest updates for the circle (public to members; no auth required for list).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const circleSlug = searchParams.get("circleSlug")?.trim() ?? "";
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
      100
    );

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

    const res = await query<Row>(
      `SELECT u.id, u.circle_id, u.title, u.content, u.created_by, u.created_at, us.name AS author_name
       FROM circle_updates u
       LEFT JOIN users us ON us.id = u.created_by
       WHERE u.circle_id = $1
       ORDER BY u.created_at DESC
       LIMIT $2`,
      [circle.id, limit]
    );

    const updates = (res.rows || []).map((r) => ({
      id: r.id,
      circle_id: r.circle_id,
      title: r.title,
      content: r.content,
      created_by: r.created_by,
      created_at: r.created_at,
      author_name: r.author_name ?? "Anonymous",
    }));

    return NextResponse.json({ updates });
  } catch (e) {
    console.error("GET /api/circle-updates/list error:", e);
    return NextResponse.json(
      { error: "Failed to list updates" },
      { status: 500 }
    );
  }
}
