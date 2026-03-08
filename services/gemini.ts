/**
 * Gemini API — for image/vision features (scanning, OCR, image QA).
 * Add GEMINI_API_KEY to .env.local to enable.
 */

import { hasGemini, getGeminiKey } from "@/lib/env";

export type GeminiVisionResult = {
  text: string;
  success: boolean;
  error?: string;
};

/** Check if Gemini is available for vision tasks. */
export function isGeminiAvailable(): boolean {
  return hasGemini();
}

/**
 * Analyze an image (base64) with Gemini. For future image scanning / OCR.
 * Returns extracted text or description.
 */
export async function geminiAnalyzeImage(params: {
  imageBase64: string;
  mimeType?: string;
  prompt?: string;
}): Promise<GeminiVisionResult> {
  if (!hasGemini()) {
    return { text: "", success: false, error: "GEMINI_NOT_CONFIGURED" };
  }

  const apiKey = getGeminiKey().replace(/\r|\n/g, "").trim();
  const prompt =
    params.prompt ??
    "Describe this image in detail. If it contains text, extract and transcribe it.";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: params.mimeType ?? "image/jpeg",
                    data: params.imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { text: "", success: false, error: err || `Gemini API error: ${res.status}` };
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    return { text, success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { text: "", success: false, error: msg };
  }
}
