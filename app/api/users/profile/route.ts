import { NextResponse } from "next/server";
import { query } from "@/database/db";

export const dynamic = "force-dynamic";

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{2,32}$/.test(username);
}

type ProfileRow = {
  id: string;
  name: string | null;
  created_at: string;
  joined_circles_count: number;
  message_count: number;
};

// Simple in-memory rate limit per username to avoid scraping.
const profileRequests = new Map<string, number[]>();
const WINDOW_MS = 10_000;
const MAX_REQUESTS_PER_WINDOW = 30;

function allowProfileRequest(username: string): boolean {
  const now = Date.now();
  const key = username.toLowerCase();
  const arr = (profileRequests.get(key) ?? []).filter(
    (ts) => now - ts < WINDOW_MS
  );
  if (arr.length >= MAX_REQUESTS_PER_WINDOW) {
    profileRequests.set(key, arr);
    return false;
  }
  arr.push(now);
  profileRequests.set(key, arr);
  return true;
}

/**
 * GET /api/users/profile?username=alex
 * Returns minimal public profile stats for a user.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get("username")?.trim() ?? "";

    if (!usernameParam || !isValidUsername(usernameParam)) {
      return NextResponse.json(
        { error: "Invalid or missing username" },
        { status: 400 }
      );
    }

    if (!allowProfileRequest(usernameParam)) {
      return NextResponse.json(
        { error: "Too many profile requests. Please wait and try again." },
        { status: 429 }
      );
    }

    // We treat users.name as the public username field.
    const res = await query<ProfileRow>(
      `
      SELECT
        u.id,
        u.name,
        u.created_at,
        COALESCE(c.cnt, 0) AS joined_circles_count,
        COALESCE(m.cnt, 0) AS message_count
      FROM users u
      LEFT JOIN (
        SELECT cm.user_id, COUNT(*)::int AS cnt
        FROM circle_members cm
        GROUP BY cm.user_id
      ) c ON c.user_id = u.id
      LEFT JOIN (
        SELECT m.user_id, COUNT(*)::int AS cnt
        FROM circle_messages m
        GROUP BY m.user_id
      ) m ON m.user_id = u.id
      WHERE u.name = $1
      LIMIT 1
      `,
      [usernameParam]
    );

    const row = res.rows[0];
    if (!row) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: row.id,
      username: row.name ?? usernameParam,
      joinedAt: row.created_at,
      joinedCircles: row.joined_circles_count,
      messagesSent: row.message_count,
    });
  } catch (e) {
    console.error("GET /api/users/profile error:", e);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

