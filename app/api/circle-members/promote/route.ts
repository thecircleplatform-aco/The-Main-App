import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireCircleAdmin } from "@/lib/circle-admin-auth";

export const dynamic = "force-dynamic";

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

const ALLOWED_ROLES = ["member", "moderator", "admin"] as const;

/**
 * POST /api/circle-members/promote
 * Body: { circleSlug, userId, role }
 * Only circle admins. role must be member | moderator | admin.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const circleSlug =
      typeof body?.circleSlug === "string" ? body.circleSlug.trim() : "";
    const targetUserId =
      typeof body?.userId === "string" ? body.userId.trim() : "";
    const role =
      typeof body?.role === "string" && ALLOWED_ROLES.includes(body.role as (typeof ALLOWED_ROLES)[number])
        ? (body.role as (typeof ALLOWED_ROLES)[number])
        : "";

    if (!circleSlug || !isValidSlug(circleSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing circleSlug" },
        { status: 400 }
      );
    }
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Invalid or missing userId" },
        { status: 400 }
      );
    }
    if (!role) {
      return NextResponse.json(
        { error: "Invalid or missing role (member, moderator, admin)" },
        { status: 400 }
      );
    }

    const adminResult = await requireCircleAdmin(circleSlug);
    if ("response" in adminResult) {
      return adminResult.response;
    }
    const { info } = adminResult;

    const memberRes = await query<{ id: string }>(
      "SELECT id FROM circle_members WHERE circle_id = $1 AND user_id = $2",
      [info.circleId, targetUserId]
    );
    if (memberRes.rows.length === 0) {
      return NextResponse.json(
        { error: "User is not a member of this circle" },
        { status: 404 }
      );
    }

    await query(
      "UPDATE circle_members SET role = $1 WHERE circle_id = $2 AND user_id = $3",
      [role, info.circleId, targetUserId]
    );

    return NextResponse.json({ success: true, role });
  } catch (e) {
    console.error("POST /api/circle-members/promote error:", e);
    return NextResponse.json(
      { error: "Failed to promote member" },
      { status: 500 }
    );
  }
}
