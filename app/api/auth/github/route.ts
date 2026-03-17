import { NextResponse } from "next/server";

/**
 * Redirects to NextAuth GitHub sign-in. Use for "Continue with GitHub" buttons.
 * Configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in env.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const callbackUrl = url.searchParams.get("callbackUrl") ?? url.searchParams.get("from") ?? "/";
  const signInUrl = `${origin}/api/auth/signin/github?callbackUrl=${encodeURIComponent(origin + callbackUrl)}`;
  return NextResponse.redirect(signInUrl);
}
