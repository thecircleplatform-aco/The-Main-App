import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { getCircleMemberInfo } from "@/lib/circle-admin-auth";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

type Row = {
  user_id: string;
  role: string;
  joined_at: string;
  username: string | null;
  role_priority: number;
  message_count: number;
};

// Simple in-memory rate limit per userId to reduce scraping.
const memberListRequests = new Map<string, number[]>();
const WINDOW_MS = 10_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function allowedMemberListRequest(userId: string): boolean {
  const now = Date.now();
  const arr = (memberListRequests.get(userId) ?? []).filter(
    (ts) => now - ts < WINDOW_MS
  );
  if (arr.length >= MAX_REQUESTS_PER_WINDOW) {
    memberListRequests.set(userId, arr);
    return false;
  }
  arr.push(now);
  memberListRequests.set(userId, arr);
  return true;
}

type CursorPayload = {
  rolePriority: number;
  joinedAt: string;
  userId: string;
};

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const json = Buffer.from(cursor, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Partial<CursorPayload>;
    if (
      typeof parsed.rolePriority === "number" &&
      typeof parsed.joinedAt === "string" &&
      typeof parsed.userId === "string"
    ) {
      return {
        rolePriority: parsed.rolePriority,
        joinedAt: parsed.joinedAt,
        userId: parsed.userId,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * GET /api/circle-members/list?circleSlug=bts&limit=50&cursor=...&search=alex
 * Public (per-circle) member discovery. Caller must be a member of the circle.
 * Returns minimal public fields only.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const circleSlug = searchParams.get("circleSlug")?.trim() ?? "";
    const limitRaw = searchParams.get("limit") ?? String(DEFAULT_LIMIT);
    const cursor = searchParams.get("cursor")?.trim() ?? "";
    const search = searchParams.get("search")?.trim() ?? "";

    if (!circleSlug || !isValidSlug(circleSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing circleSlug" },
        { status: 400 }
      );
    }

    const info = await getCircleMemberInfo(circleSlug);
    if (!info) {
      return NextResponse.json(
        { error: "You must be a member of this circle to view members" },
        { status: 403 }
      );
    }

    if (!allowedMemberListRequest(info.userId)) {
      return NextResponse.json(
        {
          error:
            "Too many member list requests. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    const limit = Math.min(
      Math.max(1, parseInt(limitRaw, 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const conditions: string[] = ["cm.circle_id = $1"];
    const params: unknown[] = [info.circleId];

    if (search) {
      conditions.push("LOWER(u.name) LIKE LOWER($2)");
      params.push(`%${search}%`);
    }

    let cursorPayload: CursorPayload | null = null;
    if (cursor) {
      cursorPayload = decodeCursor(cursor);
      if (!cursorPayload) {
        return NextResponse.json(
          { error: "Invalid cursor" },
          { status: 400 }
        );
      }
      const rolePriorityCase =
        "CASE cm.role WHEN 'admin' THEN 3 WHEN 'moderator' THEN 2 ELSE 1 END";
      conditions.push(
        `(${rolePriorityCase}, cm.joined_at, cm.user_id) > ($${
          params.length + 1
        }, $${params.length + 2}, $${params.length + 3})`
      );
      params.push(
        cursorPayload.rolePriority,
        cursorPayload.joinedAt,
        cursorPayload.userId
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sql = `
      SELECT
        cm.user_id,
        cm.role,
        cm.joined_at,
        u.name AS username,
        CASE cm.role
          WHEN 'admin' THEN 3
          WHEN 'moderator' THEN 2
          ELSE 1
        END AS role_priority,
        COALESCE(msgs.message_count, 0) AS message_count
      FROM circle_members cm
      JOIN users u ON u.id = cm.user_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS message_count
        FROM circle_messages m
        WHERE m.circle_id = cm.circle_id
          AND m.user_id = cm.user_id
      ) msgs ON TRUE
      ${whereClause}
      ORDER BY role_priority DESC, cm.joined_at ASC, cm.user_id ASC
      LIMIT $${params.length + 1}
    `;

    params.push(limit);

    const res = await query<Row>(sql, params);
    const rows = res.rows || [];

    const members = rows.map((r) => ({
      user_id: r.user_id,
      username: r.username ?? "Member",
      role: r.role,
      joined_at: r.joined_at,
      message_count: r.message_count,
    }));

    let nextCursor: string | null = null;
    if (rows.length === limit) {
      const last = rows[rows.length - 1]!;
      nextCursor = encodeCursor({
        rolePriority: last.role_priority,
        joinedAt: last.joined_at,
        userId: last.user_id,
      });
    }

    return NextResponse.json({ members, nextCursor });
  } catch (e) {
    console.error("GET /api/circle-members/list error:", e);
    return NextResponse.json(
      { error: "Failed to list members" },
      { status: 500 }
    );
  }
}

