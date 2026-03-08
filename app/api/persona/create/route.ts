import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { configErrorResponse } from "@/lib/configError";

const ALLOWED_INTERESTS = [
  "technology",
  "sports",
  "business",
  "music",
  "art",
  "science",
  "relationships",
  "learning",
] as const;

const AI_PERSONALITIES = ["Supportive", "Strategic", "Creative", "Analytical"] as const;

function buildSystemPrompt(params: {
  nickname: string;
  interests: string[];
  goals: string;
  ai_personality: string;
  age?: number;
  country?: string;
}): string {
  const interestsText =
    params.interests.length > 0
      ? params.interests.join(", ")
      : "general topics";
  const goalsText = params.goals.trim() || "their stated goals";
  const ageContext = params.age ? ` They are ${params.age} years old.` : "";
  const countryContext = params.country ? ` They are from ${params.country}.` : "";

  return `You are the personal AI assistant for ${params.nickname}.${ageContext}${countryContext}

Their interests include: ${interestsText}.
Their goals include: ${goalsText}.

Your personality style should be ${params.ai_personality}.

Provide thoughtful, conversational advice tailored to their interests and goals.`;
}

function getAgeFromBirthDate(birthDate: string | null | undefined): number | undefined {
  if (!birthDate) return undefined;
  try {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age >= 0 && age <= 120 ? age : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      nickname?: string;
      interests?: unknown;
      goals?: string;
      ai_personality?: string;
      idea_sharing_enabled?: boolean;
      gender?: string;
      birth_date?: string;
      country?: string;
    };

    const nickname =
      typeof body.nickname === "string" ? body.nickname.trim() : "";
    if (!nickname) {
      return NextResponse.json(
        { error: "Nickname is required" },
        { status: 400 }
      );
    }

    const rawInterests = Array.isArray(body.interests) ? body.interests : [];
    const interests = rawInterests.filter((i): i is (typeof ALLOWED_INTERESTS)[number] =>
      typeof i === "string" && (ALLOWED_INTERESTS as readonly string[]).includes(i)
    );
    if (interests.length === 0) {
      return NextResponse.json(
        { error: "Select at least one interest" },
        { status: 400 }
      );
    }

    const goals = typeof body.goals === "string" ? body.goals.trim() : "";
    const gender = typeof body.gender === "string" ? body.gender.trim() || null : null;
    const birthDate = typeof body.birth_date === "string" && body.birth_date.trim()
      ? body.birth_date.trim()
      : null;
    const country = typeof body.country === "string" ? body.country.trim() || null : null;
    const age = getAgeFromBirthDate(birthDate);

    const aiPersonality =
      typeof body.ai_personality === "string" &&
      AI_PERSONALITIES.includes(body.ai_personality as (typeof AI_PERSONALITIES)[number])
        ? body.ai_personality
        : "Supportive";
    const ideaSharingEnabled = Boolean(body.idea_sharing_enabled);

    const system_prompt = buildSystemPrompt({
      nickname,
      interests,
      goals,
      ai_personality: aiPersonality,
      age,
      country: country ?? undefined,
    });

    await query(
      `INSERT INTO personas (user_id, nickname, interests, goals, ai_personality, idea_sharing_enabled, system_prompt, gender, birth_date, country)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         nickname = EXCLUDED.nickname,
         interests = EXCLUDED.interests,
         goals = EXCLUDED.goals,
         ai_personality = EXCLUDED.ai_personality,
         idea_sharing_enabled = EXCLUDED.idea_sharing_enabled,
         system_prompt = EXCLUDED.system_prompt,
         gender = EXCLUDED.gender,
         birth_date = EXCLUDED.birth_date,
         country = EXCLUDED.country`,
      [
        session.sub,
        nickname,
        JSON.stringify(interests),
        goals || null,
        aiPersonality,
        ideaSharingEnabled,
        system_prompt,
        gender,
        birthDate || null,
        country,
      ]
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    const msg = e instanceof Error ? e.message : "";
    const isSchemaError =
      typeof msg === "string" &&
      (msg.includes("column") || msg.includes("does not exist"));
    return NextResponse.json(
      {
        error: isSchemaError
          ? "Database schema is outdated. Run 'npm run db:seed' to update, then try again."
          : "Failed to create persona. Please try again.",
      },
      { status: 500 }
    );
  }
}
