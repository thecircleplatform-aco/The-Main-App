/**
 * Auth API: session, password, and types.
 * Implementations live in @/auth (services, utils, types). This file re-exports
 * for backward compatibility so existing imports from @/services/auth keep working.
 */

export { getSession, createSession, destroySession } from "@/auth/services/sessionService";
export { hashPassword, verifyPassword } from "@/auth/services/passwordService";
export type { SessionPayload } from "@/auth/types/authTypes";
