/**
 * Platform authorization: user roles and permission checks.
 * All protected routes must verify authentication and role permissions.
 */

export type PlatformRole = "USER" | "MODERATOR" | "ADMIN";

/** Admin panel roles (stored in admin_users table). */
export type AdminRole = "owner" | "admin" | "viewer";

/**
 * Check if an admin role can manage other admins (owner only).
 */
export function canManageAdmins(role: AdminRole): boolean {
  return role === "owner";
}

/**
 * Check if an admin role can edit content (agents, users, tickets, etc.).
 */
export function canEditContent(role: AdminRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Check if an admin role can view admin content (all roles).
 */
export function canViewContent(role: AdminRole): boolean {
  return true;
}

export function isValidAdminRole(r: string): r is AdminRole {
  return r === "owner" || r === "admin" || r === "viewer";
}
