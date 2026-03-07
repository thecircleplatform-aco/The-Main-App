import { NextResponse } from "next/server";
import { z } from "zod";
import { runCouncil } from "@/services/council";
import { configErrorResponse } from "@/lib/configError";

export const maxDuration = 60;

const bodySchema = z.object({
  idea: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    const result = await runCouncil(parsed.data.idea);
    return NextResponse.json(result);
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

