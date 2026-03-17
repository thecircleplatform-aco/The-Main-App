import { NextResponse } from "next/server";
import { query } from "@/database/db";

export const dynamic = "force-dynamic";

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

/**
 * GET /api/circles
 * Returns list of circles. Optional query: category, search.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim() || null;
    const search = searchParams.get("search")?.trim() || null;

    let whereClause = "WHERE 1=1";
    const params: string[] = [];
    let idx = 1;

    if (category) {
      params.push(category);
      whereClause += ` AND category = $${idx}`;
      idx += 1;
    }
    if (search) {
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
      whereClause += ` AND (name ILIKE $${idx} OR description ILIKE $${idx + 1})`;
      idx += 2;
    }

    const sqlWithImage = `
      SELECT DISTINCT ON (slug)
        id,
        name,
        slug,
        category,
        description,
        circle_image_url,
        member_count,
        created_at,
        updated_at
      FROM circles
      ${whereClause}
      ORDER BY slug, member_count DESC, id ASC
    `;

    const sqlWithoutImage = `
      SELECT DISTINCT ON (slug)
        id,
        name,
        slug,
        category,
        description,
        member_count,
        created_at,
        updated_at
      FROM circles
      ${whereClause}
      ORDER BY slug, member_count DESC, id ASC
    `;

    // Prefer selecting circle_image_url if the column exists; fall back gracefully if not.
    const res = await query<CircleRow & { circle_image_url?: string | null }>(
      sqlWithImage,
      params.length > 0 ? params : []
    ).catch((err: Error & { message?: string }) => {
      const message = err?.message ?? "";
      if (message.includes('column "circle_image_url" does not exist')) {
        // Retry without the new column against older databases.
        return query<CircleRow>(
          sqlWithoutImage,
          params.length > 0 ? params : []
        );
      }
      throw err;
    });

    const rows = ((res as any).rows || []).sort(
      (a: CircleRow, b: CircleRow) =>
        b.member_count - a.member_count || a.name.localeCompare(b.name)
    );

    // Deduplicate by (name, category) so the same logical circle doesn't appear twice
    // (e.g. same name with different slugs from legacy data). Keep the one with highest member_count.
    const byNameCategory = new Map<string, CircleRow>();
    for (const r of rows) {
      const key = `${r.name}\n${r.category}`;
      const existing = byNameCategory.get(key);
      if (!existing || r.member_count > existing.member_count) {
        byNameCategory.set(key, r);
      }
    }
    const deduped = Array.from(byNameCategory.values()).sort(
      (a, b) => b.member_count - a.member_count || a.name.localeCompare(b.name)
    );

    const list = deduped.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      description: r.description ?? "",
      member_count: r.member_count,
      members: r.member_count,
      circle_image_url: r.circle_image_url ?? null,
    }));

    return NextResponse.json(list);
  } catch (e) {
    const err = e as Error & { code?: string };
    const message = err?.message ?? "";
    if (
      message.includes("does not exist") ||
      err?.code === "DATABASE_NOT_CONFIGURED"
    ) {
      console.warn("GET /api/circles:", message);
      return NextResponse.json([]);
    }
    console.error("GET /api/circles error:", e);
    return NextResponse.json(
      { error: "Failed to fetch circles" },
      { status: 500 }
    );
  }
}
