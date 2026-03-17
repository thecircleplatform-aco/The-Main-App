import { NextResponse } from "next/server";
import { query } from "@/database/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

type Row = {
  id: string;
  circle_id: string;
  channel_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
  user_name: string | null;
};

/**
 * GET /api/circle-messages/history?circleSlug=bts&channel=general&before=uuid (optional)
 * Returns latest messages (newest first); use before=messageId for older page.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const circleSlug = searchParams.get("circleSlug")?.trim() ?? "";
    const channel = searchParams.get("channel")?.trim() ?? "";
    const before = searchParams.get("before")?.trim() ?? "";

    if (!circleSlug || !isValidSlug(circleSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing circleSlug" },
        { status: 400 }
      );
    }
    if (!channel || !isValidSlug(channel)) {
      return NextResponse.json(
        { error: "Invalid or missing channel" },
        { status: 400 }
      );
    }

    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10)),
      MAX_PAGE_SIZE
    );

    const circleRes = await query<{ id: string }>(
      "SELECT id FROM circles WHERE slug = $1",
      [circleSlug]
    );
    const circle = circleRes.rows[0];
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const channelRes = await query<{ id: string }>(
      "SELECT id FROM circle_channels WHERE circle_id = $1 AND slug = $2",
      [circle.id, channel]
    );
    const ch = channelRes.rows[0];
    if (!ch) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    let sql: string;
    let params: unknown[];
    if (before) {
      const tsRes = await query<{ created_at: string }>(
        "SELECT created_at FROM circle_messages WHERE id = $1",
        [before]
      );
      const ts = tsRes.rows[0]?.created_at;
      if (!ts) {
        return NextResponse.json({ error: "Invalid before cursor" }, { status: 400 });
      }
      sql = `
        SELECT m.id, m.circle_id, m.channel_id, m.user_id, m.message_text, m.created_at, u.name AS user_name
        FROM circle_messages m
        LEFT JOIN users u ON u.id = m.user_id
        WHERE m.channel_id = $1 AND m.created_at < $2
        ORDER BY m.created_at DESC
        LIMIT $3
      `;
      params = [ch.id, ts, limit];
    } else {
      sql = `
        SELECT m.id, m.circle_id, m.channel_id, m.user_id, m.message_text, m.created_at, u.name AS user_name
        FROM circle_messages m
        LEFT JOIN users u ON u.id = m.user_id
        WHERE m.channel_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2
      `;
      params = [ch.id, limit];
    }

    const res = await query<Row>(sql, params);
    const messages = (res.rows || []).map((r) => ({
      id: r.id,
      circle_id: r.circle_id,
      channel_id: r.channel_id,
      user_id: r.user_id,
      username: r.user_name ?? "Anonymous",
      message_text: r.message_text,
      created_at: r.created_at,
    }));

    return NextResponse.json({
      messages,
      hasMore: res.rows.length === limit,
    });
  } catch (e) {
    console.error("GET /api/circle-messages/history error:", e);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}
