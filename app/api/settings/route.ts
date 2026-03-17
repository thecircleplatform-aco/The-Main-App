import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { configErrorResponse } from "@/config/configError";

const settingsSchema = z.object({
  profile: z
    .object({
      displayName: z.string().optional(),
      bio: z.string().optional(),
    })
    .optional(),
  privacy: z
    .object({
      showProfilePublic: z.boolean().optional(),
      shareIdeasWithModels: z.boolean().optional(),
      dataRetentionDays: z.number().int().optional(),
    })
    .optional(),
  notifications: z
    .object({
      emailSummaries: z.boolean().optional(),
      productUpdates: z.boolean().optional(),
      aiActivity: z.boolean().optional(),
    })
    .optional(),
  ai: z
    .object({
      formality: z.enum(["casual", "balanced", "formal"]).optional(),
      explanationDepth: z
        .enum(["minimal", "standard", "detailed"])
        .optional(),
      allowAgentDebate: z.boolean().optional(),
    })
    .optional(),
});

async function getDemoUserId() {
  const res = await query<{ id: string }>(
    "select id from users order by created_at asc limit 1"
  );
  if (!res.rows[0]) {
    throw new Error("No users found for settings");
  }
  return res.rows[0].id;
}

export async function GET() {
  try {
    const userId = await getDemoUserId();
    const res = await query(
      `
      select profile, privacy, notifications, ai
      from user_settings
      where user_id = $1
    `,
      [userId]
    );

    if (!res.rows[0]) {
      return NextResponse.json({
        profile: {},
        privacy: {},
        notifications: {},
        ai: {},
      });
    }

    return NextResponse.json(res.rows[0]);
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings payload" },
      { status: 400 }
    );
  }

  try {
    const userId = await getDemoUserId();
    const { profile, privacy, notifications, ai } = parsed.data;

    const res = await query(
      `
      insert into user_settings (user_id, profile, privacy, notifications, ai)
      values ($1, coalesce($2, '{}'::jsonb), coalesce($3, '{}'::jsonb), coalesce($4, '{}'::jsonb), coalesce($5, '{}'::jsonb))
      on conflict (user_id)
      do update set
        profile = coalesce($2, user_settings.profile),
        privacy = coalesce($3, user_settings.privacy),
        notifications = coalesce($4, user_settings.notifications),
        ai = coalesce($5, user_settings.ai),
        updated_at = now()
      returning profile, privacy, notifications, ai;
    `,
      [
        userId,
        profile ? JSON.stringify(profile) : null,
        privacy ? JSON.stringify(privacy) : null,
        notifications ? JSON.stringify(notifications) : null,
        ai ? JSON.stringify(ai) : null,
      ]
    );

    return NextResponse.json(res.rows[0]);
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

