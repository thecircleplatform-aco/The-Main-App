import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "circle_session";

const PUBLIC_PATHS = ["/login", "/register", "/terms", "/privacy", "/ai-policy"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow API, static assets, and Next internals
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(COOKIE_NAME);

  // Already signed in → don't show login/register
  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Not signed in on a protected route → send to login
  if (!hasSession && !isPublicPath(pathname)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)$).*)"],
};
