import axios from "axios";
import { getDeepSeekKey } from "@/lib/env";
import {
  getDeepSeekModel,
  inferSituation,
  type DeepSeekModelId,
} from "@/lib/ai-models";

type DeepSeekChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Header-safe: strip newlines, carriage returns, and trim (fixes Vercel "Invalid character in header content")
function sanitizeHeaderValue(value: string): string {
  return value.replace(/\r|\n/g, "").trim();
}

export type DeepSeekOptions = {
  /** Override model; if omitted, inferred from user message. */
  model?: DeepSeekModelId;
  /** Force "chat" or "reasoning" to pick model. */
  situation?: "chat" | "reasoning";
};

export async function deepseekChat(params: {
  system: string;
  user: string;
  temperature?: number;
  /** Model/situation override. */
  model?: DeepSeekModelId;
  situation?: "chat" | "reasoning";
}) {
  const apiKey = sanitizeHeaderValue(getDeepSeekKey());
  const model =
    params.model ??
    getDeepSeekModel(
      params.situation ?? inferSituation(params.user)
    );

  const messages: DeepSeekChatMessage[] = [
    { role: "system", content: params.system },
    { role: "user", content: params.user },
  ];

  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model,
      messages,
      temperature: params.temperature ?? 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30_000,
    }
  );

  const content: unknown = res.data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("DeepSeek response missing content");
  }
  return content.trim();
}

/**
 * Stream chat completions from DeepSeek.
 * Yields token deltas as they arrive.
 */
export async function* deepseekChatStream(params: {
  system: string;
  user: string;
  temperature?: number;
  model?: DeepSeekModelId;
  situation?: "chat" | "reasoning";
}): AsyncGenerator<string, void, void> {
  const apiKey = sanitizeHeaderValue(getDeepSeekKey());
  const model =
    params.model ??
    getDeepSeekModel(
      params.situation ?? inferSituation(params.user)
    );
  const messages: DeepSeekChatMessage[] = [
    { role: "system", content: params.system },
    { role: "user", content: params.user },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: params.temperature ?? 0.7,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `DeepSeek API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") yield delta;
          } catch {
            // ignore parse errors for partial chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

