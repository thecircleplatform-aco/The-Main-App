/**
 * Safely extract client IP from request headers.
 * Supports proxies: x-forwarded-for, fly-client-ip, x-real-ip, x-vercel-forwarded-for.
 * In serverless (Vercel/Edge) there is no socket.remoteAddress; headers are the source.
 */

const HEADERS_TO_TRY = [
  "x-forwarded-for",
  "x-vercel-forwarded-for",
  "fly-client-ip",
  "x-real-ip",
  "cf-connecting-ip", // Cloudflare
] as const;

/**
 * Get client IP from request. Returns first non-empty value from known headers.
 * x-forwarded-for can be "client, proxy1, proxy2" — we use the first (client).
 */
export function getClientIP(request: Request): string | null {
  for (const name of HEADERS_TO_TRY) {
    const value = request.headers.get(name);
    if (value) {
      const first = value.split(",")[0]?.trim();
      if (first) return first;
    }
  }
  return null;
}
