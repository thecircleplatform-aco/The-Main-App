import { z } from "zod";

// Strip newlines/spaces so env vars pasted in Vercel (or .env) don't break headers
const trimSecret = (s: string) => s.replace(/\r|\n/g, "").trim();

const optionalString = z
  .string()
  .optional()
  .default("")
  .transform(trimSecret);

const envSchema = z.object({
  DEEPSEEK_API_KEY: optionalString,
  GEMINI_API_KEY: optionalString,
  DATABASE_URL: optionalString,
  SESSION_SECRET: optionalString,
});

declare global {
  // eslint-disable-next-line no-var
  var __circle_env: z.infer<typeof envSchema> | undefined;
}

const PLACEHOLDER_DEEPSEEK = /your_deepseek_api_key_here/i;
const PLACEHOLDER_DATABASE = /your_.*_here|password@ep-xxx|:\/\/user:password@/i;

function getParsed() {
  if (globalThis.__circle_env) return globalThis.__circle_env;
  const parsed = envSchema.safeParse(process.env);
  globalThis.__circle_env = parsed.success ? parsed.data : {
    DEEPSEEK_API_KEY: "",
    GEMINI_API_KEY: "",
    DATABASE_URL: "",
    SESSION_SECRET: "",
  };
  return globalThis.__circle_env;
}

/** True if a real DeepSeek API key is set (app can call AI). */
export function hasDeepSeek(): boolean {
  const key = getParsed().DEEPSEEK_API_KEY;
  return key.length > 10 && !PLACEHOLDER_DEEPSEEK.test(key);
}

/** True if a real database URL is set. */
export function hasDatabase(): boolean {
  const url = getParsed().DATABASE_URL;
  return url.length > 20 && !PLACEHOLDER_DATABASE.test(url);
}

/** Use for AI calls. Throws if not configured so API can return 503. */
export function getDeepSeekKey(): string {
  const key = getParsed().DEEPSEEK_API_KEY;
  if (!key || key.length < 10 || PLACEHOLDER_DEEPSEEK.test(key)) {
    const e = new Error("DEEPSEEK_NOT_CONFIGURED") as Error & { code?: string };
    e.code = "DEEPSEEK_NOT_CONFIGURED";
    throw e;
  }
  return key;
}

/** Use for Gemini (vision/images). Returns empty if not configured. */
export function getGeminiKey(): string {
  return getParsed().GEMINI_API_KEY ?? "";
}

/** True if Gemini API key is set (for image/vision features). */
export function hasGemini(): boolean {
  const key = getGeminiKey();
  return key.length > 10;
}

/** Use for DB. Throws if not configured. */
export function getDatabaseUrl(): string {
  const url = getParsed().DATABASE_URL;
  if (!url || url.length < 20 || PLACEHOLDER_DATABASE.test(url)) {
    const e = new Error("DATABASE_NOT_CONFIGURED") as Error & { code?: string };
    e.code = "DATABASE_NOT_CONFIGURED";
    throw e;
  }
  return url;
}

/** Use for auth JWT signing. Returns empty string if not set (auth routes will return 503). */
export function getSessionSecret(): string {
  return getParsed().SESSION_SECRET ?? "";
}
