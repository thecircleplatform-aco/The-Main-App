/**
 * AI model configuration — DeepSeek for chat, Gemini for vision/images.
 * DeepSeek: deepseek-chat (fast, general) vs deepseek-reasoner (thinking, analysis).
 */

export const DEEPSEEK_MODELS = {
  /** Fast conversation, general assistant — default for chat. */
  CHAT: "deepseek-chat",
  /** Multi-step reasoning, analysis — use for complex questions. */
  REASONER: "deepseek-reasoner",
} as const;

export type DeepSeekModelId = (typeof DEEPSEEK_MODELS)[keyof typeof DEEPSEEK_MODELS];

/** Pick model by situation. Use reasoner for analysis/planning. */
export function getDeepSeekModel(situation: "chat" | "reasoning" = "chat"): DeepSeekModelId {
  return situation === "reasoning" ? DEEPSEEK_MODELS.REASONER : DEEPSEEK_MODELS.CHAT;
}

/** Heuristics: prefer chat for speed. Only use reasoner for explicit analysis. */
export function inferSituation(userMessage: string): "chat" | "reasoning" {
  const lower = userMessage.toLowerCase();
  const strongAnalysisCues = [
    "analyze this", "step by step", "reason through", "think through",
    "compare and contrast", "evaluate", "break down", "explain in detail",
  ];
  if (strongAnalysisCues.some((c) => lower.includes(c))) return "reasoning";
  if (lower.includes("pros and cons") || lower.includes("solve step")) return "reasoning";
  return "chat";
}
