import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { requireCircleAdmin } from "@/lib/circle-admin-auth";
import { regenerateCircleImageUrl } from "@/lib/circle-images";

export const dynamic = "force-dynamic";

type Body =
  | {
      mode: "custom";
      imageUrl: string | null;
    }
  | {
      mode: "auto" | "reset";
    };

/**
 * POST /api/circles/[slug]/image
 * Circle admin-only.
 *
 * Modes:
 * - { mode: "custom", imageUrl } – set a custom image URL or data URL.
 * - { mode: "auto" } – generate an image via provider (Unsplash/Pexels) and store URL.
 * - { mode: "reset" } – clear custom image and try to regenerate automatically; if that fails, leaves null.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const adminResult = await requireCircleAdmin(slug);
    if ("error" in adminResult) {
      return adminResult.response as NextResponse;
    }
    const { info } = adminResult;

    const body = (await request.json().catch(() => ({}))) as Partial<Body>;
    const mode = body?.mode;

    if (mode !== "custom" && mode !== "auto" && mode !== "reset") {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 }
      );
    }

    let newUrl: string | null = null;

    if (mode === "custom") {
      const imageUrl =
        typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
          ? body.imageUrl.trim()
          : null;
      await query(
        "UPDATE circles SET circle_image_url = $1, updated_at = now() WHERE id = $2",
        [imageUrl, info.circleId]
      );
      newUrl = imageUrl;
    } else {
      // mode === "auto" | "reset"
      newUrl = await regenerateCircleImageUrl(info.circleId);
    }

    return NextResponse.json({
      success: true,
      circle_image_url: newUrl,
    });
  } catch (e) {
    console.error("POST /api/circles/[slug]/image error:", e);
    return NextResponse.json(
      { error: "Failed to update circle image" },
      { status: 500 }
    );
  }
}

