import { NextResponse } from "next/server";
import { query } from "@/database/db";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 64;

type CircleRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  member_count: number;
};

type UserRow = {
  id: string;
  name: string | null;
};

// Simple in-memory rate limiting per query string
const searchRequests = new Map<string, number[]>();
const WINDOW_MS = 10_000;
const MAX_REQUESTS_PER_WINDOW = 40;

function allowSearch(key: string): boolean {
  const now = Date.now();
  const k = key.toLowerCase();
  const arr = (searchRequests.get(k) ?? []).filter(
    (ts) => now - ts < WINDOW_MS
  );
  if (arr.length >= MAX_REQUESTS_PER_WINDOW) {
    searchRequests.set(k, arr);
    return false;
  }
  arr.push(now);
  searchRequests.set(k, arr);
  return true;
}

/**
 * GET /api/search?q=query
 * Returns circles and users matching the query.
 * If q is empty, returns trending circles by member_count.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("q") ?? "";
    const q = raw.trim();

    if (!allowSearch(q || "__empty__")) {
      return NextResponse.json(
        { error: "Too many search requests. Please wait and try again." },
        { status: 429 }
      );
    }

    // Trending when no query: top circles by member_count
    if (!q) {
      const circlesRes = await query<CircleRow>(
        `
        SELECT id, name, slug, category, member_count
        FROM circles
        ORDER BY member_count DESC, created_at DESC
        LIMIT 5
        `
      );
      return NextResponse.json({
        circles: circlesRes.rows ?? [],
        users: [],
        trending: true,
      });
    }

    if (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "Query must be between 2 and 64 characters" },
        { status: 400 }
      );
    }

    const like = `%${q}%`;

    const [circlesRes, usersRes] = await Promise.all([
      query<CircleRow>(
        `
        SELECT id, name, slug, category, member_count
        FROM circles
        WHERE name ILIKE $1
           OR category ILIKE $1
           OR description ILIKE $1
        ORDER BY member_count DESC, created_at DESC
        LIMIT $2
        `,
        [like, MAX_LIMIT]
      ),
      query<UserRow>(
        `
        SELECT id, name
        FROM users
        WHERE name ILIKE $1
        ORDER BY name ASC
        LIMIT $2
        `,
        [like, MAX_LIMIT]
      ),
    ]);

    const circles = (circlesRes.rows ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      member_count: c.member_count,
    }));

    const users = (usersRes.rows ?? []).map((u) => ({
      id: u.id,
      username: u.name ?? "",
    }));

    return NextResponse.json({ circles, users, trending: false });
  } catch (e) {
    console.error("GET /api/search error:", e);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

