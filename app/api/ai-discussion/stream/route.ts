import { NextResponse } from "next/server";
import { z } from "zod";
import type { EngineMessage } from "@/services/aiEngine";
import { routeMessageStream } from "@/services/agentRouter";
import { configErrorResponse } from "@/lib/configError";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

// Allow up to 60s for streaming
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

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

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
      {
        error: "ACCOUNT_SCHEDULED_FOR_DELETION",
        message:
          "Your account is scheduled for deletion. Recover your account to continue chatting.",
      },
      { status: 403 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { userMessage, history } = parsed.data;

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
  if (persona?.system_prompt) personalSystemPrompt = persona.system_prompt;
  if (persona) {
    userContext = {
      nickname: persona.nickname?.trim() || undefined,
      gender:
        persona.gender?.trim() && persona.gender !== "prefer-not"
          ? persona.gender
          : undefined,
      aiPersonality: persona.ai_personality?.trim() || undefined,
    };
    if (
      !userContext.nickname &&
      !userContext.gender &&
      !userContext.aiPersonality
    ) {
      userContext = undefined;
    }
  }

  const historyTyped = (history ?? []) as EngineMessage[];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of routeMessageStream(userMessage, historyTyped, {
          personalSystemPrompt,
          userContext,
        })) {
          if (event.type === "intro") {
            controller.enqueue(
              encoder.encode(sseEvent("intro", { messages: event.messages }))
            );
          } else if (event.type === "started") {
            controller.enqueue(
              encoder.encode(sseEvent("started", { situation: event.situation }))
            );
          } else if (event.type === "content") {
            controller.enqueue(
              encoder.encode(sseEvent("content", { chunk: event.chunk }))
            );
          } else if (event.type === "done") {
            controller.enqueue(
              encoder.encode(
                sseEvent("done", {
                  agent: event.agent,
                  messageId: event.messageId,
                })
              )
            );
          }
        }
        controller.enqueue(encoder.encode(sseEvent("end", {})));
        controller.close();
      } catch (e) {
        const configRes = configErrorResponse(e);
        const errMessage = configRes
          ? "Configuration error. Check your API keys and database."
          : e instanceof Error
            ? e.message
            : "Failed to run AI discussion";
        controller.enqueue(encoder.encode(sseEvent("error", { error: errMessage })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
