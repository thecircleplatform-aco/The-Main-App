import { NextResponse } from "next/server";

/**
 * Consistent JSON error response for API routes.
 */
export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Validate Content-Type for JSON POST/PATCH bodies.
 */
export function requireJson(req: Request): Promise<unknown> | null {
  const type = req.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return null;
  return req.json().catch(() => null);
}
