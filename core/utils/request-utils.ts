/** Extract client IP from request headers (Vercel, proxies, etc.) */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for") ?? request.headers.get("x-vercel-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}
