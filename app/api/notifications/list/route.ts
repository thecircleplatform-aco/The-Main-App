import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

type Row = {
  id: string;
  user_id: string;
  type: string;
  circle_id: string | null;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

type CursorPayload = {
  createdAt: string;
  id: string;
};

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const json = Buffer.from(cursor, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Partial<CursorPayload>;
    if (typeof parsed.createdAt === "string" && typeof parsed.id === "string") {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * GET /api/notifications/list?limit=10&cursor=...&unreadOnly=true
 * Returns notifications for the current user (newest first).
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.sub;

    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit") ?? String(DEFAULT_LIMIT);
    const cursor = searchParams.get("cursor")?.trim() ?? "";
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const limit = Math.min(
      Math.max(1, parseInt(limitRaw, 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const conditions: string[] = ["user_id = $1"];
    const params: unknown[] = [userId];

    if (unreadOnly) {
      conditions.push("is_read = false");
    }

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }
      conditions.push(
        "(created_at, id) < ($2::timestamptz, $3::uuid)"
      );
      params.push(decoded.createdAt, decoded.id);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sql = `
      SELECT id, user_id, type, circle_id, title, content, is_read, created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const res = await query<Row>(sql, params);
    const rows = res.rows || [];

    const notifications = rows.map((r) => ({
      id: r.id,
      type: r.type,
      circle_id: r.circle_id,
      title: r.title,
      content: r.content,
      is_read: r.is_read,
      created_at: r.created_at,
    }));

    let nextCursor: string | null = null;
    if (rows.length === limit) {
      const last = rows[rows.length - 1]!;
      nextCursor = encodeCursor({
        createdAt: last.created_at,
        id: last.id,
      });
    }

    return NextResponse.json({ notifications, nextCursor });
  } catch (e) {
    console.error("GET /api/notifications/list error:", e);
    return NextResponse.json(
      { error: "Failed to list notifications" },
      { status: 500 }
    );
  }
}

