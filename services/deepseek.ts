import axios from "axios";
import { getDeepSeekKey } from "@/lib/env";

type DeepSeekChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Header-safe: strip newlines, carriage returns, and trim (fixes Vercel "Invalid character in header content")
function sanitizeHeaderValue(value: string): string {
  return value.replace(/\r|\n/g, "").trim();
}

export async function deepseekChat(params: {
  system: string;
  user: string;
  temperature?: number;
}) {
  const apiKey = sanitizeHeaderValue(getDeepSeekKey());

  const messages: DeepSeekChatMessage[] = [
    { role: "system", content: params.system },
    { role: "user", content: params.user },
  ];

  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
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

