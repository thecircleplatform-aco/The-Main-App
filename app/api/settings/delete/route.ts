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
    await query("delete from users where id = $1", [userId]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

