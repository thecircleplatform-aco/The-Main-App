import { NextResponse } from "next/server";
import { AI_MODEL_VERSION } from "@/lib/version";
import pkg from "../../../package.json";

function getAppVersion(): string {
  return (pkg as { version?: string }).version ?? "0.1.0";
}

export async function GET() {
  const gitVersion =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_SHA ??
    process.env.NEXT_PUBLIC_GIT_SHA ??
    null;

  return NextResponse.json({
    appVersion: getAppVersion(),
    gitVersion: gitVersion ? gitVersion.slice(0, 7) : null,
    aiVersion: AI_MODEL_VERSION,
  });
}
