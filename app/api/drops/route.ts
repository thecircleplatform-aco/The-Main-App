import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";

export const dynamic = "force-dynamic";

type DropRow = {
  id: string;
  type: string;
  text: string | null;
  image_url: string | null;
  video_url: string | null;
  caption: string | null;
  duration_seconds: number | null;
  created_at: string;
  circle_name: string;
  circle_slug: string;
  user_name: string | null;
};

type CommentRow = {
  id: string;
  author_name: string | null;
  text: string;
  created_at: string;
  parent_comment_id: string | null;
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

/**
 * GET /api/drops
 * Returns all drops (posts and videos) with like counts and comments.
 * Optional ?circleSlug= to filter by circle.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const circleSlug = searchParams.get("circleSlug")?.trim() ?? null;
    const session = await getSession();
    const userId = session?.sub ?? null;

    let sql = `
      SELECT d.id, d.type, d.text, d.image_url, d.video_url, d.caption, d.duration_seconds, d.created_at,
             c.name AS circle_name, c.slug AS circle_slug,
             u.name AS user_name
      FROM drops d
      JOIN circles c ON c.id = d.circle_id
      JOIN users u ON u.id = d.user_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    if (circleSlug) {
      params.push(circleSlug);
      sql += ` AND c.slug = $${params.length}`;
    }
    sql += ` ORDER BY d.created_at DESC`;

    const res = await query<DropRow>(sql, params.length ? params : undefined);
    const rows = res.rows ?? [];

    const dropIds = rows.map((r) => r.id);
    const likeCountRes = await query<{ drop_id: string; count: string }>(
      `SELECT drop_id, count(*)::text AS count FROM drop_likes WHERE drop_id = ANY($1::uuid[]) GROUP BY drop_id`,
      [dropIds]
    );
    const likeCountByDrop: Record<string, number> = {};
    for (const r of likeCountRes.rows ?? []) {
      likeCountByDrop[r.drop_id] = parseInt(r.count, 10);
    }

    const isLikedByDrop: Record<string, boolean> = {};
    if (userId && dropIds.length > 0) {
      const likedRes = await query<{ drop_id: string }>(
        `SELECT drop_id FROM drop_likes WHERE user_id = $1 AND drop_id = ANY($2::uuid[])`,
        [userId, dropIds]
      );
      for (const r of likedRes.rows ?? []) {
        isLikedByDrop[r.drop_id] = true;
      }
    }

    const commentsSqlWithReplies = `SELECT dc.drop_id, dc.id, dc.text, dc.created_at, dc.parent_comment_id, u.name AS author_name
       FROM drop_comments dc
       JOIN users u ON u.id = dc.user_id
       WHERE dc.drop_id = ANY($1::uuid[])
       ORDER BY dc.created_at ASC`;
    const commentsSqlFlat = `SELECT dc.drop_id, dc.id, dc.text, dc.created_at, NULL::uuid AS parent_comment_id, u.name AS author_name
       FROM drop_comments dc
       JOIN users u ON u.id = dc.user_id
       WHERE dc.drop_id = ANY($1::uuid[])
       ORDER BY dc.created_at ASC`;

    let commentsRes;
    try {
      commentsRes = await query<CommentRow & { drop_id: string }>(
        commentsSqlWithReplies,
        [dropIds]
      );
    } catch (e: any) {
      // Backwards-compatible fallback for older DBs without parent_comment_id.
      if (e?.code !== "42703") throw e;
      commentsRes = await query<CommentRow & { drop_id: string }>(
        commentsSqlFlat,
        [dropIds]
      );
    }
    const commentsByDrop: Record<
      string,
      { id: string; author: string; text: string; createdAt: string; replies: { id: string; author: string; text: string; createdAt: string }[] }[]
    > = {};
    const topByIdByDrop: Record<string, Record<string, (typeof commentsByDrop)[string][number]>> = {};
    const replyBufferByDrop: Record<string, Record<string, { id: string; author: string; text: string; createdAt: string }[]>> = {};
    for (const r of commentsRes.rows ?? []) {
      const dropId = r.drop_id;
      commentsByDrop[dropId] = commentsByDrop[dropId] ?? [];
      topByIdByDrop[dropId] = topByIdByDrop[dropId] ?? {};
      replyBufferByDrop[dropId] = replyBufferByDrop[dropId] ?? {};

      const base = {
        id: r.id,
        author: r.author_name ?? "Anonymous",
        text: r.text,
        createdAt: relativeTime(r.created_at),
      };

      if (!r.parent_comment_id) {
        const node = {
          ...base,
          replies: replyBufferByDrop[dropId][r.id] ?? [],
        };
        delete replyBufferByDrop[dropId][r.id];
        commentsByDrop[dropId].push(node);
        topByIdByDrop[dropId][r.id] = node;
      } else {
        const parent = topByIdByDrop[dropId][r.parent_comment_id];
        if (parent) parent.replies.push(base);
        else {
          replyBufferByDrop[dropId][r.parent_comment_id] =
            replyBufferByDrop[dropId][r.parent_comment_id] ?? [];
          replyBufferByDrop[dropId][r.parent_comment_id].push(base);
        }
      }
    }

    const posts: {
      id: string;
      type: "post";
      userName: string;
      userAvatar: string;
      circleName: string;
      circleSlug: string;
      text?: string;
      imageUrl?: string;
      createdAt: string;
      likes: number;
      isLiked: boolean;
      comments: { id: string; author: string; text: string; createdAt: string }[];
    }[] = [];
    const videos: {
      id: string;
      type: "video";
      userName: string;
      userAvatar: string;
      circleName: string;
      circleSlug: string;
      videoUrl: string;
      caption?: string;
      durationSeconds: number;
      createdAt: string;
      likes: number;
      isLiked: boolean;
      comments: { id: string; author: string; text: string; createdAt: string }[];
    }[] = [];

    for (const r of rows) {
      const userName = r.user_name ?? "Anonymous";
      const userAvatar = userName.charAt(0).toUpperCase();
      const likes = likeCountByDrop[r.id] ?? 0;
      const isLiked = isLikedByDrop[r.id] ?? false;
      const comments = commentsByDrop[r.id] ?? [];

      if (r.type === "post") {
        posts.push({
          id: r.id,
          type: "post",
          userName,
          userAvatar,
          circleName: r.circle_name,
          circleSlug: r.circle_slug,
          text: r.text ?? undefined,
          imageUrl: r.image_url ?? undefined,
          createdAt: relativeTime(r.created_at),
          likes,
          isLiked,
          comments,
        });
      } else {
        videos.push({
          id: r.id,
          type: "video",
          userName,
          userAvatar,
          circleName: r.circle_name,
          circleSlug: r.circle_slug,
          videoUrl: r.video_url ?? "",
          caption: r.caption ?? undefined,
          durationSeconds: r.duration_seconds ?? 0,
          createdAt: relativeTime(r.created_at),
          likes,
          isLiked,
          comments,
        });
      }
    }

    return NextResponse.json({ posts, videos });
  } catch (e) {
    console.error("GET /api/drops error:", e);
    return NextResponse.json(
      { error: "Failed to list drops" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drops
 * Body: { type: 'post'|'video', circleSlug?, text?, imageUrl?, videoUrl?, caption?, durationSeconds? }
 * Defaults to ai-builders circle. Requires auth.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body?.type === "video" ? "video" : "post";
    const circleSlug = (body?.circleSlug ?? "ai-builders").trim() || "ai-builders";
    const text = typeof body?.text === "string" ? body.text.trim() : null;
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() || null : null;
    const videoUrl = typeof body?.videoUrl === "string" ? body.videoUrl.trim() || null : null;
    const caption = typeof body?.caption === "string" ? body.caption.trim() || null : null;
    const durationSeconds =
      typeof body?.durationSeconds === "number" && body.durationSeconds >= 0
        ? Math.round(body.durationSeconds)
        : null;

    if (type === "post" && !text && !imageUrl) {
      return NextResponse.json(
        { error: "Post needs text or an image" },
        { status: 400 }
      );
    }
    if (type === "video") {
      if (!videoUrl) {
        return NextResponse.json(
          { error: "Video URL is required" },
          { status: 400 }
        );
      }
      if (!caption) {
        return NextResponse.json(
          { error: "Caption is required" },
          { status: 400 }
        );
      }
      if (typeof durationSeconds === "number" && durationSeconds > 60) {
        return NextResponse.json(
          { error: "Video must be 60 seconds or less" },
          { status: 400 }
        );
      }
    }

    const circleRes = await query<{ id: string; name: string }>(
      "SELECT id, name FROM circles WHERE slug = $1",
      [circleSlug]
    );
    const circle = circleRes.rows[0];
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const insertRes = await query<{
      id: string;
      type: string;
      text: string | null;
      image_url: string | null;
      video_url: string | null;
      caption: string | null;
      duration_seconds: number | null;
      created_at: string;
    }>(
      `INSERT INTO drops (circle_id, user_id, type, text, image_url, video_url, caption, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, text, image_url, video_url, caption, duration_seconds, created_at`,
      [
        circle.id,
        session.sub,
        type,
        type === "post" ? text : null,
        type === "post" ? imageUrl : null,
        type === "video" ? videoUrl : null,
        type === "video" ? caption : null,
        type === "video" ? durationSeconds : null,
      ]
    );
    const row = insertRes.rows[0];
    if (!row) {
      return NextResponse.json(
        { error: "Failed to create drop" },
        { status: 500 }
      );
    }

    const userName = session.name ?? "You";
    const userAvatar = userName.charAt(0).toUpperCase();

    if (type === "post") {
      return NextResponse.json({
        success: true,
        drop: {
          id: row.id,
          type: "post",
          userName,
          userAvatar,
          circleName: circle.name,
          circleSlug,
          text: row.text ?? undefined,
          imageUrl: row.image_url ?? undefined,
          createdAt: "Just now",
          likes: 0,
          isLiked: false,
          comments: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      drop: {
        id: row.id,
        type: "video",
        userName,
        userAvatar,
        circleName: circle.name,
        circleSlug,
        videoUrl: row.video_url ?? "",
        caption: row.caption ?? undefined,
        durationSeconds: row.duration_seconds ?? 0,
        createdAt: "Just now",
        likes: 0,
        isLiked: false,
        comments: [],
      },
    });
  } catch (e) {
    console.error("POST /api/drops error:", e);
    return NextResponse.json(
      { error: "Failed to create drop" },
      { status: 500 }
    );
  }
}
