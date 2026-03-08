import { NextResponse } from "next/server";
import { z } from "zod";
import type { EngineMessage } from "@/services/aiEngine";
import { routeMessage } from "@/services/agentRouter";
import { configErrorResponse } from "@/lib/configError";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

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

    let personalSystemPrompt: string | undefined;
    let userContext: { nickname?: string; gender?: string; aiPersonality?: string } | undefined;
    const personaRes = await query<{
      system_prompt: string;
      nickname: string;
      gender: string | null;
      ai_personality: string | null;
    }>(
      "SELECT system_prompt, nickname, gender, ai_personality FROM personas WHERE user_id = $1",
      [session.sub]
    );
    const persona = personaRes.rows[0];
    if (persona?.system_prompt) {
      personalSystemPrompt = persona.system_prompt;
    }
    if (persona) {
      userContext = {
        nickname: persona.nickname?.trim() || undefined,
        gender: persona.gender?.trim() && persona.gender !== "prefer-not" ? persona.gender : undefined,
        aiPersonality: persona.ai_personality?.trim() || undefined,
      };
      if (!userContext.nickname && !userContext.gender && !userContext.aiPersonality) {
        userContext = undefined;
      }
    }

    const result = await routeMessage(userMessage, historyTyped, {
      personalSystemPrompt,
      userContext,
    });

    const now = new Date().toISOString();
    let newMessages: EngineMessage[];

    if (result.kind === "intro") {
      newMessages = result.messages;
    } else {
      newMessages = [
        {
          id: generateId("msg"),
          role: "agent",
          content: result.message,
          agentName: result.agent,
          createdAt: now,
        },
      ];
    }

    return NextResponse.json({
      agents: [],
      messages: [...historyTyped, ...newMessages],
      rounds: 1,
      paused: false,
      insight: { title: "", summary: "" },
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    const message =
      e instanceof Error ? e.message : "Failed to run AI discussion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

