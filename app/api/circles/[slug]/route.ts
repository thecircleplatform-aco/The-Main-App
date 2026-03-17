import { NextResponse } from "next/server";
import { query } from "@/database/db";

export const dynamic = "force-dynamic";

/** Allow only safe slug characters: lowercase letters, numbers, hyphen */
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 200;
}

type CircleRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  circle_image_url: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
};

type ChannelRow = {
  slug: string;
  name: string;
};

/**
 * GET /api/circles/[slug]
 * Returns single circle with channels list.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug || !isValidSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const sql = `
      SELECT id,
             name,
             slug,
             category,
             description,
             circle_image_url,
             member_count,
             created_at,
             updated_at
      FROM circles WHERE slug = $1
    `;

    const circleRes = await query<CircleRow & { circle_image_url?: string | null }>(
      sql,
      [slug]
    ).catch((err: Error & { message?: string }) => {
      const message = err?.message ?? "";
      if (message.includes('column "circle_image_url" does not exist')) {
        // Fallback for older databases without the new column.
        return query<CircleRow>(
          `SELECT id, name, slug, category, description, member_count, created_at, updated_at
           FROM circles WHERE slug = $1`,
          [slug]
        );
      }
      throw err;
    });

    const circle = (circleRes as any).rows[0] as CircleRow & {
      circle_image_url?: string | null;
    };
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const channelsRes = await query<ChannelRow>(
      `SELECT slug, name FROM circle_channels WHERE circle_id = $1 ORDER BY slug ASC`,
      [circle.id]
    );

    const channels = channelsRes.rows.map((r) => r.slug);

    return NextResponse.json({
      id: circle.id,
      name: circle.name,
      slug: circle.slug,
      category: circle.category,
      description: circle.description ?? "",
      member_count: circle.member_count,
      circle_image_url: circle.circle_image_url ?? null,
      channels,
      channelList: channelsRes.rows.map((r) => ({ slug: r.slug, name: r.name })),
    });
  } catch (e) {
    console.error("GET /api/circles/[slug] error:", e);
    return NextResponse.json(
      { error: "Failed to fetch circle" },
      { status: 500 }
    );
  }
}
