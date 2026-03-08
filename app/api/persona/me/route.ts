import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { configErrorResponse } from "@/lib/configError";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await query<{
      id: string;
      nickname: string;
      interests: string[];
      goals: string | null;
      ai_personality: string;
      idea_sharing_enabled: boolean;
      system_prompt: string;
      created_at: string;
    }>(
      `SELECT id, nickname, interests, goals, ai_personality, idea_sharing_enabled, system_prompt, created_at
       FROM personas
       WHERE user_id = $1`,
      [session.sub]
    );

    const row = res.rows[0];
    if (!row) {
      return NextResponse.json({ error: "No persona found" }, { status: 404 });
    }

    const interests =
      typeof row.interests === "string"
        ? (JSON.parse(row.interests) as string[])
        : Array.isArray(row.interests)
          ? row.interests
          : [];

    return NextResponse.json({
      id: row.id,
      nickname: row.nickname,
      interests,
      goals: row.goals ?? undefined,
      ai_personality: row.ai_personality,
      idea_sharing_enabled: row.idea_sharing_enabled,
      system_prompt: row.system_prompt,
      created_at: row.created_at,
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
