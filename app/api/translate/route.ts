import { NextResponse } from "next/server";

/**
 * Translate text using MyMemory API. No API key required (free tier).
 * Detects target language from Accept-Language or explicit param.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const text = typeof json?.text === "string" ? json.text.trim() : "";
    const target = typeof json?.target === "string" ? json.target.trim().slice(0, 5) : null;
    const source = typeof json?.source === "string" ? json.source.trim().slice(0, 5) : "en";

    if (!text || text.length > 5000) {
      return NextResponse.json(
        { error: "Invalid or too long text" },
        { status: 400 }
      );
    }

    // Detect target from Accept-Language if not provided
    let targetLang = target;
    if (!targetLang) {
      const acceptLang = req.headers.get("Accept-Language") ?? "en";
      const first = acceptLang.split(",")[0]?.trim().split("-")[0];
      targetLang = first ?? "en";
    }
    targetLang = targetLang?.toLowerCase().slice(0, 2) || "en";
    if (targetLang === source) {
      return NextResponse.json({ translatedText: text, source: source, target: targetLang });
    }

    const langpair = `${source}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Circle/1.0" } });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Translation API error: ${res.status}`);
    }
    const data = (await res.json()) as { responseData?: { translatedText?: string } };
    const translatedText = data.responseData?.translatedText ?? text;

    return NextResponse.json({ translatedText, source, target: targetLang });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Translation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
