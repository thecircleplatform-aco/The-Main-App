import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/services/auth";

export const dynamic = "force-dynamic";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/drops/upload-video
 * Multipart form with "video" file. Max 60s (checked client-side), max 50MB.
 * Returns { url: string } for use in POST /api/drops.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("video");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Video too large (max 50MB)" },
        { status: 400 }
      );
    }

    const type = file.type.toLowerCase();
    if (!type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    const ext = type.includes("webm") ? "webm" : "mp4";
    const name = `drops-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "drops");
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, name);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/drops/${name}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("POST /api/drops/upload-video error:", e);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
