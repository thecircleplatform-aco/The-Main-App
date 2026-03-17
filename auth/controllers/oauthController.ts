/**
 * OAuth controller. Placeholder for future OAuth providers (Google, GitHub, etc.).
 */

import { NextResponse } from "next/server";

/** Initiate OAuth flow (redirect to provider). TODO: implement per provider. */
export async function handleOAuthInitiate(
  _request: Request,
  _provider: string
): Promise<NextResponse> {
  return NextResponse.json(
    { error: "OAuth not yet implemented." },
    { status: 501 }
  );
}

/** OAuth callback (exchange code for token, create or link user, set session). TODO: implement. */
export async function handleOAuthCallback(
  _request: Request,
  _provider: string
): Promise<NextResponse> {
  return NextResponse.json(
    { error: "OAuth not yet implemented." },
    { status: 501 }
  );
}
