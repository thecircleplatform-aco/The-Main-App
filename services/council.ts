import { DEFAULT_PERSONAS } from "@/admin/personas";
import type { CouncilMessage } from "@/types/council";
import { deepseekChat } from "@/services/deepseek";

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export async function runCouncil(idea: string) {
  const messages: CouncilMessage[] = [
    {
      id: id("user"),
      role: "user",
      content: idea,
      createdAt: nowIso(),
    },
  ];

  for (const persona of DEFAULT_PERSONAS) {
    const content = await deepseekChat({
      system: persona.systemPrompt,
      user: idea,
      temperature: 0.7,
    });

    messages.push({
      id: id("asst"),
      role: "assistant",
      personaId: persona.id,
      personaName: persona.name,
      content,
      createdAt: nowIso(),
    });
  }

  return { messages };
}

