/**
 * Personal AI Crew router: Lumana (Circle AI) is default.
 * Sam, Alex, Maya, Nova reply only when user explicitly calls them by name.
 */

import { inferSituation } from "@/lib/ai-models";
import { deepseekChat, deepseekChatStream } from "@/services/deepseek";
import {
  getCrewAgent,
  HUMAN_TONE_INSTRUCTION,
  type CrewAgentId,
} from "@/agents/agents";
import type { EngineMessage } from "@/services/aiEngine";

export type UserContext = {
  /** User's preferred name (e.g. from persona). */
  nickname?: string;
  /** How the user prefers to be referred to; use for natural, respectful tone. */
  gender?: string;
  /** e.g. Supportive, Strategic — match energy, don't be robotic. */
  aiPersonality?: string;
};

const CALLABLE_AGENT_NAMES: CrewAgentId[] = ["sam", "alex", "maya", "nova"];

/** Detect which agent name is mentioned in the message (first match wins). Lumana is default, not callable. */
export function detectAgentName(text: string): CrewAgentId | null {
  const lower = text.toLowerCase().trim();
  for (const name of CALLABLE_AGENT_NAMES) {
    const re = new RegExp(`\\b${name}\\b`, "i");
    if (re.test(lower)) return name;
  }
  return null;
}

/** Whether the message looks like a first greeting. */
export function isGreeting(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/\s+/g, " ");
  const greetings = [
    "hi",
    "hello",
    "hey",
    "hi there",
    "hello there",
    "hey there",
    "howdy",
    "greetings",
  ];
  if (greetings.includes(t)) return true;
  if (/^hi\s*[,!.]*$/.test(t) || /^hello\s*[,!.]*$/.test(t)) return true;
  return false;
}

/** Use when history is empty and message is a greeting → show crew intro. */
export function isFirstChatIntroduction(history: EngineMessage[], text: string): boolean {
  const noHistory = !history || history.length === 0;
  return noHistory && isGreeting(text);
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/** Build intro message from Lumana (default). */
export function getIntroMessages(): EngineMessage[] {
  const now = new Date().toISOString();
  const lumana = getCrewAgent("lumana");
  return [
    {
      id: generateId("msg"),
      role: "agent" as const,
      content: lumana.introLine,
      agentName: lumana.name,
      createdAt: now,
    },
  ];
}

export type RouteResult =
  | { kind: "intro"; messages: EngineMessage[] }
  | { kind: "reply"; agent: string; message: string };

function buildUserContextInstruction(ctx?: UserContext): string {
  if (!ctx || (!ctx.nickname && !ctx.gender && !ctx.aiPersonality)) return "";
  const parts: string[] = [];
  if (ctx.nickname) parts.push(`You're chatting with ${ctx.nickname}.`);
  if (ctx.gender && ctx.gender !== "prefer-not") {
    parts.push(
      `Match their vibe and communication style naturally; keep your tone human and appropriate, not stiff or stereotyped.`
    );
  }
  if (ctx.aiPersonality) {
    parts.push(
      `They prefer a ${ctx.aiPersonality} style — reflect that in how you respond, without sounding scripted.`
    );
  }
  if (parts.length === 0) return "";
  return "\n" + parts.join(" ") + "\n";
}

/**
 * Route the user message: detect agent name → one agent responds.
 * Returns either intro messages (first greeting) or a single { agent, message }.
 */
export async function routeMessage(
  userMessage: string,
  history: EngineMessage[],
  options?: { personalSystemPrompt?: string; userContext?: UserContext }
): Promise<RouteResult> {
  if (isFirstChatIntroduction(history, userMessage)) {
    return { kind: "intro", messages: getIntroMessages() };
  }

  const detected = detectAgentName(userMessage);
  const agentId: CrewAgentId = detected ?? "lumana";
  const agent = getCrewAgent(agentId);

  const systemParts = [
    options?.personalSystemPrompt ? `${options.personalSystemPrompt}\n\n` : "",
    agent.systemPrompt,
    HUMAN_TONE_INSTRUCTION,
    buildUserContextInstruction(options?.userContext),
    "Do not mention other agents or that you were \"chosen.\" Just reply as yourself, like a real person would.",
  ].filter(Boolean);

  const historyContext =
    history.length === 0
      ? ""
      : history
          .slice(-6)
          .map((m) => {
            const who = m.role === "user" ? "User" : m.agentName ?? "Agent";
            return `${who}: ${m.content}`;
          })
          .join("\n");

  const userPrompt =
    historyContext.length > 0
      ? `${historyContext}\n\nUser: ${userMessage}`
      : userMessage;

  const content = await deepseekChat({
    system: systemParts.join("\n"),
    user: userPrompt,
    temperature: 0.75,
  });

  return {
    kind: "reply",
    agent: agent.name,
    message: content.trim(),
  };
}

/** Stream a single agent's reply. For intro, yields { type: "intro"; messages } then ends. */
export async function* routeMessageStream(
  userMessage: string,
  history: EngineMessage[],
  options?: { personalSystemPrompt?: string; userContext?: UserContext }
): AsyncGenerator<
  | { type: "intro"; messages: EngineMessage[] }
  | { type: "started"; situation: "chat" | "reasoning" }
  | { type: "content"; chunk: string }
  | { type: "done"; agent: string; messageId: string },
  void,
  void
> {
  if (isFirstChatIntroduction(history, userMessage)) {
    yield { type: "intro", messages: getIntroMessages() };
    return;
  }

  const detected = detectAgentName(userMessage);
  const agentId: CrewAgentId = detected ?? "lumana";
  const agent = getCrewAgent(agentId);

  const systemParts = [
    options?.personalSystemPrompt ? `${options.personalSystemPrompt}\n\n` : "",
    agent.systemPrompt,
    HUMAN_TONE_INSTRUCTION,
    buildUserContextInstruction(options?.userContext),
    "Do not mention other agents or that you were \"chosen.\" Just reply as yourself, like a real person would.",
  ].filter(Boolean);

  const historyContext =
    history.length === 0
      ? ""
      : history
          .slice(-6)
          .map((m) => {
            const who = m.role === "user" ? "User" : m.agentName ?? "Agent";
            return `${who}: ${m.content}`;
          })
          .join("\n");

  const userPrompt =
    historyContext.length > 0
      ? `${historyContext}\n\nUser: ${userMessage}`
      : userMessage;

  const situation = inferSituation(userMessage);
  yield { type: "started", situation };

  for await (const chunk of deepseekChatStream({
    system: systemParts.join("\n"),
    user: userPrompt,
    temperature: 0.75,
    situation,
  })) {
    yield { type: "content", chunk };
  }

  yield {
    type: "done",
    agent: agent.name,
    messageId: `msg_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`,
  };
}
