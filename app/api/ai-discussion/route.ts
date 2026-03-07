import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgentDiscussion } from "@/services/aiEngine";
import type { EngineMessage } from "@/services/aiEngine";
import { configErrorResponse } from "@/lib/configError";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

// Allow up to 60s for multi-agent + insight (Vercel Pro default; Hobby 10s)
export const maxDuration = 60;

const bodySchema = z.object({
  userMessage: z.string().min(1),
  history: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "agent", "system"]),
        content: z.string(),
        agentId: z.any().optional(),
        agentName: z.string().optional(),
        internal: z.boolean().optional(),
        createdAt: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "You must be signed in to chat." },
      { status: 401 }
    );
  }

  const userRes = await query<{ deletion_scheduled_at: string | null }>(
    "SELECT deletion_scheduled_at FROM users WHERE id = $1",
    [session.sub]
  );
  if (userRes.rows[0]?.deletion_scheduled_at) {
    return NextResponse.json(
      { error: "ACCOUNT_SCHEDULED_FOR_DELETION", message: "Your account is scheduled for deletion. Recover your account to continue chatting." },
      { status: 403 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { userMessage, history } = parsed.data;

  try {
    const historyTyped = (history ?? []) as EngineMessage[];

    const result = await runAgentDiscussion({
      userMessage,
      history: historyTyped,
      options: {
        internalDiscussion: false,
        fastReply: true, // 1 agent, no selection LLM = instant reply
      },
    });

    // Return immediately; skip insight so user sees replies as fast as possible
    return NextResponse.json({
      ...result,
      insight: { title: "Council reply", summary: "" },
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    const message =
      e instanceof Error ? e.message : "Failed to run AI discussion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

