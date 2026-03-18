import { NextResponse } from "next/server";
import { getSession } from "@/services/auth";
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
 * GET /api/circles/my
 * Returns circles the current user has joined. Requires logged-in user.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.sub;

    const sql = `
      SELECT c.id,
             c.name,
             c.slug,
             c.category,
             c.description,
             c.circle_image_url,
             c.member_count,
             c.created_at,
             c.updated_at
      FROM circles c
      JOIN circle_members cm ON c.id = cm.circle_id
      WHERE cm.user_id = $1
      ORDER BY c.name ASC
    `;

    const res = await query<CircleRow & { circle_image_url?: string | null }>(
      sql,
      [userId]
    ).catch((err: Error & { message?: string; code?: string }) => {
      const message = err?.message ?? "";
      const code = err?.code ?? "";
      if (
        code === "42703" ||
        message.includes("circle_image_url") ||
        message.includes('column "circle_image_url" does not exist')
      ) {
        return query<CircleRow>(
          `
          SELECT c.id,
                 c.name,
                 c.slug,
                 c.category,
                 c.description,
                 c.member_count,
                 c.created_at,
                 c.updated_at
          FROM circles c
          JOIN circle_members cm ON c.id = cm.circle_id
          WHERE cm.user_id = $1
          ORDER BY c.name ASC
        `,
          [userId]
        );
      }
      throw err;
    });

    const list = (res as any).rows.map((r: any) => ({
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
    console.error("GET /api/circles/my error:", e);
    return NextResponse.json(
      { error: "Failed to fetch your circles" },
      { status: 500 }
    );
  }
}
