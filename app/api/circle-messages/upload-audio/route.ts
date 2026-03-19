import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/services/auth";

export const dynamic = "force-dynamic";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB

function isAllowedAudioType(type: string): boolean {
  const t = (type || "").toLowerCase();
  return (
    t === "audio/webm" ||
    t === "audio/ogg" ||
    t === "audio/mpeg" ||
    t === "audio/mp3" ||
    t === "audio/mp4" ||
    t === "audio/wav"
  );
}

function extFromType(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("webm")) return "webm";
  if (t.includes("ogg")) return "ogg";
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  if (t.includes("mp4")) return "m4a";
  if (t.includes("wav")) return "wav";
  return "webm";
}

/**
 * POST /api/circle-messages/upload-audio
 * Multipart form with "audio" file. Max 8MB.
 * Returns { url: string } for use in POST /api/circle-messages/send
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("audio");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Audio too large (max 8MB)" },
        { status: 400 }
      );
    }

    if (!isAllowedAudioType(file.type)) {
      return NextResponse.json(
        { error: "Unsupported audio format" },
        { status: 400 }
      );
    }

    const ext = extFromType(file.type);
    const name = `circle-audio-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "circles", "audio");
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, name);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/circles/audio/${name}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("POST /api/circle-messages/upload-audio error:", e);
    return NextResponse.json({ error: "Failed to upload audio" }, { status: 500 });
  }
}

