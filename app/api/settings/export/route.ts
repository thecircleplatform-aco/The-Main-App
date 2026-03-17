import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { configErrorResponse } from "@/config/configError";

async function getDemoUserId() {
  const res = await query<{ id: string }>(
    "select id from users order by created_at asc limit 1"
  );
  if (!res.rows[0]) {
    throw new Error("No users found");
  }
  return res.rows[0].id;
}

export async function POST() {
  try {
    const userId = await getDemoUserId();

    const [userRes, settingsRes, sessionsRes, messagesRes] = await Promise.all([
      query("select id, email, name, created_at from users where id = $1", [
        userId,
      ]),
      query("select profile, privacy, notifications, ai from user_settings where user_id = $1", [
        userId,
      ]),
      query("select * from sessions where user_id = $1 order by created_at", [
        userId,
      ]),
      query(
        "select * from messages where user_id = $1 order by created_at limit 1000",
        [userId]
      ),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      user: userRes.rows[0] ?? null,
      settings: settingsRes.rows[0] ?? null,
      sessions: sessionsRes.rows,
      messages: messagesRes.rows,
      insights: [],
    };

    return NextResponse.json(payload);
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

