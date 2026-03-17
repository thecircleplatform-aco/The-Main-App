import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireCircleAdmin } from "@/lib/circle-admin-auth";

export const dynamic = "force-dynamic";

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

type Row = {
  user_id: string;
  role: string;
  joined_at: string;
  name: string | null;
  email: string;
};

/**
 * GET /api/circle-members/admin-list?circleSlug=bts
 * Returns members with role and profile. Only circle admins (or super admins).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const circleSlug = searchParams.get("circleSlug")?.trim() ?? "";

    if (!circleSlug || !isValidSlug(circleSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing circleSlug" },
        { status: 400 }
      );
    }

    const adminResult = await requireCircleAdmin(circleSlug);
    if ("response" in adminResult) {
      return adminResult.response;
    }

    const res = await query<Row>(
      `SELECT cm.user_id, cm.role, cm.joined_at, u.name, u.email
       FROM circle_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.circle_id = $1
       ORDER BY cm.role DESC, cm.joined_at ASC`,
      [adminResult.info.circleId]
    );

    const members = (res.rows || []).map((r) => ({
      user_id: r.user_id,
      role: r.role,
      joined_at: r.joined_at,
      name: r.name ?? undefined,
      email: r.email,
    }));

    return NextResponse.json({ members });
  } catch (e) {
    console.error("GET /api/circle-members/admin-list error:", e);
    return NextResponse.json(
      { error: "Failed to list members" },
      { status: 500 }
    );
  }
}

