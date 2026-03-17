import { NextResponse } from "next/server";

/**
 * Redirects to NextAuth Google sign-in. Use this URL for "Continue with Google" buttons.
 * Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const callbackUrl = url.searchParams.get("callbackUrl") ?? url.searchParams.get("from") ?? "/";
  const signInUrl = `${origin}/api/auth/signin/google?callbackUrl=${encodeURIComponent(origin + callbackUrl)}`;
  return NextResponse.redirect(signInUrl);
}
