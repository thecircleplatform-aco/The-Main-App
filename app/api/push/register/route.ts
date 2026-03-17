import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";

const bodySchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["android", "ios", "web"]),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.sub;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid push registration payload" },
      { status: 400 }
    );
  }

  const { token, platform } = parsed.data;

  try {
    await query(
      `
      INSERT INTO device_tokens (user_id, device_token, platform)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, device_token)
      DO UPDATE SET platform = EXCLUDED.platform
      `,
      [userId, token, platform]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to store device token", e);
    return NextResponse.json(
      { error: "Failed to store device token" },
      { status: 500 }
    );
  }
}

