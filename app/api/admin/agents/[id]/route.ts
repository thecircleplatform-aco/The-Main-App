import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { configErrorResponse } from "@/lib/configError";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  name: z.string().min(2).optional(),
  personality: z.string().min(2).optional(),
  system_prompt: z.string().min(10).optional(),
  avatar: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid agent id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid agent payload" },
      { status: 400 }
    );
  }

  const id = parsedParams.data.id;
  const updates = parsedBody.data;

  const fields: string[] = [];
  const values: unknown[] = [];

  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    fields.push(`${key} = $${idx++}`);
    values.push(value);
  }

  if (fields.length === 0) {
    return NextResponse.json({ ok: true });
  }

  values.push(id);

  try {
    await query(
      `update agents set ${fields.join(", ")} where id = $${idx}::uuid`,
      values
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    const message =
      e instanceof Error ? e.message : "Failed to update agent record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

