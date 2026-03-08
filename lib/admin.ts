import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export type AdminRole = "owner" | "admin" | "viewer";

export type AdminSession = {
  sub: string;
  email: string;
  name: string | null;
  role: AdminRole;
};

/**
 * Get the current session and verify the user is an admin.
 * Returns null if not logged in or not in admin_users.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getSession();
  if (!session?.email) return null;

  const res = await query<{ role: string }>(
    `select role from admin_users where lower(email) = lower($1)`,
    [session.email]
  );

  const row = res.rows[0];
  if (!row || !isValidRole(row.role)) return null;

  return {
    sub: session.sub,
    email: session.email,
    name: session.name,
    role: row.role as AdminRole,
  };
}

function isValidRole(r: string): r is AdminRole {
  return r === "owner" || r === "admin" || r === "viewer";
}

/**
 * Check if the admin has permission to perform an action.
 * owner: full access including managing admins
 * admin: manage agents, users, discussions
 * viewer: read-only
 */
export function canManageAdmins(role: AdminRole): boolean {
  return role === "owner";
}

export function canEditContent(role: AdminRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewContent(role: AdminRole): boolean {
  return true;
}

/**
 * For API routes: require admin session. Returns 401/403 JSON response on failure.
 */
export async function requireAdmin(options?: {
  requireEdit?: boolean;
  requireOwner?: boolean;
}): Promise<{ admin: AdminSession } | NextResponse> {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (options?.requireOwner && !canManageAdmins(admin.role)) {
    return NextResponse.json({ error: "Forbidden: owner role required" }, { status: 403 });
  }

  if (options?.requireEdit && !canEditContent(admin.role)) {
    return NextResponse.json({ error: "Forbidden: edit permission required" }, { status: 403 });
  }

  return { admin };
}
