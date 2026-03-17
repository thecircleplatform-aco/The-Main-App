import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { configErrorResponse } from "@/config/configError";
import { requireAdmin } from "@/services/admin";

const agentBodySchema = z.object({
  name: z.string().min(2),
  personality: z.string().min(2),
  system_prompt: z.string().min(10),
  avatar: z.string().nullable().optional(),
  active: z.boolean(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const res = await query(
      "select id, name, personality, system_prompt, avatar, active, created_at from agents order by created_at desc"
    );
    return NextResponse.json({ agents: res.rows });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const json = await req.json().catch(() => null);
  const parsed = agentBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid agent payload" },
      { status: 400 }
    );
  }

  const { name, personality, system_prompt, avatar, active } = parsed.data;

  try {
    const res = await query(
      `
        insert into agents (name, personality, system_prompt, avatar, active)
        values ($1, $2, $3, $4, $5)
        returning id
      `,
      [name, personality, system_prompt, avatar ?? null, active]
    );
    return NextResponse.json({ id: res.rows[0].id });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    const message =
      e instanceof Error ? e.message : "Failed to create agent record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

