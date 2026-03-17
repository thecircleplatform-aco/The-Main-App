import { NextResponse } from "next/server";

const CONFIG_CODES = [
  "DEEPSEEK_NOT_CONFIGURED",
  "DATABASE_NOT_CONFIGURED",
  "SESSION_SECRET_NOT_CONFIGURED",
] as const;

function getCode(e: unknown): string | null {
  if (e instanceof Error && "code" in e && typeof (e as Error & { code?: string }).code === "string") {
    const code = (e as Error & { code: string }).code;
    if (CONFIG_CODES.includes(code as (typeof CONFIG_CODES)[number])) return code;
  }
  return null;
}

/** If e is a config error (missing API key or DB), return 503 response; else null. */
export function configErrorResponse(e: unknown): NextResponse | null {
  const code = getCode(e);
  if (!code) return null;
  const message =
    code === "DEEPSEEK_NOT_CONFIGURED"
      ? "Add DEEPSEEK_API_KEY in Vercel (or .env.local) to enable AI."
      : code === "SESSION_SECRET_NOT_CONFIGURED"
        ? "Add SESSION_SECRET in Vercel (or .env.local) for login/registration."
        : "Add DATABASE_URL in Vercel (or .env.local) to enable database.";
  return NextResponse.json({ error: message, code }, { status: 503 });
}
