/**
 * Circle admin/moderator auth: resolve circle by slug and check user role.
 * Super admins (admin_users) are allowed for admin actions.
 */

import { getSession } from "@/services/auth";
import { getAdminSession } from "@/services/admin";
import { query } from "@/database/db";

export type CircleRole = "member" | "moderator" | "admin";

export type CircleMemberInfo = {
  circleId: string;
  circleSlug: string;
  circleName: string;
  userId: string;
  role: CircleRole;
  isSuperAdmin: boolean;
};

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

/**
 * Get current user's membership and role for a circle by slug.
 * Returns null if not logged in, circle not found, or user not a member.
 */
export async function getCircleMemberInfo(
  circleSlug: string
): Promise<CircleMemberInfo | null> {
  const session = await getSession();
  if (!session?.sub) return null;

  if (!circleSlug || !isValidSlug(circleSlug)) return null;

  const circleRes = await query<{ id: string; name: string }>(
    "SELECT id, name FROM circles WHERE slug = $1",
    [circleSlug]
  );
  const circle = circleRes.rows[0];
  if (!circle) return null;

  const superAdmin = await getAdminSession();
  if (superAdmin) {
    return {
      circleId: circle.id,
      circleSlug,
      circleName: circle.name,
      userId: session.sub,
      role: "admin",
      isSuperAdmin: true,
    };
  }

  const memberRes = await query<{ role: string }>(
    "SELECT role FROM circle_members WHERE circle_id = $1 AND user_id = $2",
    [circle.id, session.sub]
  );
  const row = memberRes.rows[0];
  if (!row || !["member", "moderator", "admin"].includes(row.role))
    return null;

  return {
    circleId: circle.id,
    circleSlug,
    circleName: circle.name,
    userId: session.sub,
    role: row.role as CircleRole,
    isSuperAdmin: false,
  };
}

/** Require circle admin (or super admin). Returns 401/403 response on failure. */
export async function requireCircleAdmin(circleSlug: string): Promise<
  | { info: CircleMemberInfo }
  | { error: string; status: number; response: Response }
> {
  const info = await getCircleMemberInfo(circleSlug);
  if (!info) {
    return {
      error: "Unauthorized",
      status: 401,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  if (info.role !== "admin" && !info.isSuperAdmin) {
    return {
      error: "Forbidden: circle admin required",
      status: 403,
      response: new Response(
        JSON.stringify({ error: "Forbidden: circle admin required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  return { info };
}

/** Require circle moderator or admin (or super admin). For delete message etc. */
export async function requireCircleModerator(circleSlug: string): Promise<
  | { info: CircleMemberInfo }
  | { error: string; status: number; response: Response }
> {
  const info = await getCircleMemberInfo(circleSlug);
  if (!info) {
    return {
      error: "Unauthorized",
      status: 401,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  const canModerate = info.role === "admin" || info.role === "moderator" || info.isSuperAdmin;
  if (!canModerate) {
    return {
      error: "Forbidden: moderator or admin required",
      status: 403,
      response: new Response(
        JSON.stringify({ error: "Forbidden: moderator or admin required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  return { info };
}

/** Check if user is banned from circle (for join route). */
export async function isUserBannedFromCircle(
  circleId: string,
  userId: string
): Promise<boolean> {
  const res = await query(
    "SELECT 1 FROM circle_bans WHERE circle_id = $1 AND user_id = $2",
    [circleId, userId]
  );
  return res.rows.length > 0;
}
