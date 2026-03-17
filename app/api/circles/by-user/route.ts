import { NextResponse } from "next/server";
import { query } from "@/database/db";

export const dynamic = "force-dynamic";

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{2,32}$/.test(username);
}

type CircleRow = {
  name: string;
  slug: string;
};

/**
 * GET /api/circles/by-user?username=alex
 * Returns circles that a given user (by public username) has joined.
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

    const userRes = await query<{ id: string }>(
      "SELECT id FROM users WHERE name = $1 LIMIT 1",
      [usernameParam]
    );
    const user = userRes.rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const circlesRes = await query<CircleRow>(
      `
      SELECT c.name, c.slug
      FROM circle_members cm
      JOIN circles c ON c.id = cm.circle_id
      WHERE cm.user_id = $1
      ORDER BY c.name ASC
      `,
      [user.id]
    );

    return NextResponse.json(circlesRes.rows ?? []);
  } catch (e) {
    console.error("GET /api/circles/by-user error:", e);
    return NextResponse.json(
      { error: "Failed to load joined circles" },
      { status: 500 }
    );
  }
}

