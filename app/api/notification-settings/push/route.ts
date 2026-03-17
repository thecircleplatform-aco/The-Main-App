import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";

const schema = z.object({
  mentionsEnabled: z.boolean().optional(),
  updatesEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.sub;

  const res = await query<{
    mentions_enabled: boolean;
    updates_enabled: boolean;
  }>(
    `
    SELECT mentions_enabled, updates_enabled
    FROM user_notification_settings
    WHERE user_id = $1
    `,
    [userId]
  );

  if (!res.rows[0]) {
    return NextResponse.json({
      mentionsEnabled: true,
      updatesEnabled: true,
    });
  }

  const row = res.rows[0];
  return NextResponse.json({
    mentionsEnabled: row.mentions_enabled,
    updatesEnabled: row.updates_enabled,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.sub;

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid notification settings payload" },
      { status: 400 }
    );
  }

  const { mentionsEnabled, updatesEnabled } = parsed.data;

  const res = await query(
    `
    INSERT INTO user_notification_settings (user_id, mentions_enabled, updates_enabled)
    VALUES ($1, COALESCE($2, true), COALESCE($3, true))
    ON CONFLICT (user_id)
    DO UPDATE SET
      mentions_enabled = COALESCE($2, user_notification_settings.mentions_enabled),
      updates_enabled = COALESCE($3, user_notification_settings.updates_enabled),
      updated_at = now()
    RETURNING mentions_enabled, updates_enabled
    `,
    [userId, mentionsEnabled ?? null, updatesEnabled ?? null]
  );

  const row = res.rows[0];
  return NextResponse.json({
    mentionsEnabled: row.mentions_enabled,
    updatesEnabled: row.updates_enabled,
  });
}

