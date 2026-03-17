import { NextResponse } from "next/server";
import { getCircleMemberInfo } from "@/lib/circle-admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/circles/[slug]/role
 * Returns current user's role in the circle: member | moderator | admin.
 * 401 if not logged in, 404 if not a member.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const info = await getCircleMemberInfo(slug);
    if (!info) {
      return NextResponse.json(
        { error: "Not a member or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ role: info.role, isSuperAdmin: info.isSuperAdmin });
  } catch (e) {
    console.error("GET /api/circles/[slug]/role error:", e);
    return NextResponse.json(
      { error: "Failed to get role" },
      { status: 500 }
    );
  }
}
