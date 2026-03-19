import { NextResponse } from "next/server";
import { query } from "@/database/db";
import { getSession } from "@/services/auth";

export const dynamic = "force-dynamic";

type CommentRow = {
  id: string;
  text: string;
  created_at: string;
  author_name: string | null;
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
 * GET /api/drops/[dropId]/comments
 * List comments for a drop.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const { dropId } = await params;
    if (!dropId) {
      return NextResponse.json({ error: "Missing drop ID" }, { status: 400 });
    }

    const dropExists = await query("SELECT id FROM drops WHERE id = $1", [dropId]);
    if (!dropExists.rows?.length) {
      return NextResponse.json({ error: "Drop not found" }, { status: 404 });
    }

    const sqlWithReplies = `SELECT dc.id, dc.text, dc.created_at, dc.parent_comment_id, u.name AS author_name
       FROM drop_comments dc
       JOIN users u ON u.id = dc.user_id
       WHERE dc.drop_id = $1
       ORDER BY dc.created_at ASC`;
    const sqlFlat = `SELECT dc.id, dc.text, dc.created_at, NULL::uuid AS parent_comment_id, u.name AS author_name
       FROM drop_comments dc
       JOIN users u ON u.id = dc.user_id
       WHERE dc.drop_id = $1
       ORDER BY dc.created_at ASC`;

    let res;
    try {
      res = await query<CommentRow>(sqlWithReplies, [dropId]);
    } catch (e: any) {
      if (e?.code !== "42703") throw e;
      res = await query<CommentRow>(sqlFlat, [dropId]);
    }
    const rows = res.rows ?? [];
    const topLevel: {
      id: string;
      author: string;
      text: string;
      createdAt: string;
      replies: { id: string; author: string; text: string; createdAt: string }[];
    }[] = [];
    const byId = new Map<string, (typeof topLevel)[number]>();
    const replyBuffer: Record<string, { id: string; author: string; text: string; createdAt: string }[]> = {};

    for (const r of rows) {
      const base = {
        id: r.id,
        author: r.author_name ?? "Anonymous",
        text: r.text,
        createdAt: relativeTime(r.created_at),
      };

      if (!r.parent_comment_id) {
        const node = { ...base, replies: replyBuffer[r.id] ?? [] };
        delete replyBuffer[r.id];
        topLevel.push(node);
        byId.set(r.id, node);
      } else {
        const parent = byId.get(r.parent_comment_id);
        if (parent) parent.replies.push(base);
        else {
          replyBuffer[r.parent_comment_id] = replyBuffer[r.parent_comment_id] ?? [];
          replyBuffer[r.parent_comment_id].push(base);
        }
      }
    }

    return NextResponse.json({ comments: topLevel });
  } catch (e) {
    console.error("GET /api/drops/[dropId]/comments error:", e);
    return NextResponse.json(
      { error: "Failed to list comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drops/[dropId]/comments
 * Add a comment or reply. Body: { text: string, parentCommentId?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dropId } = await params;
    if (!dropId) {
      return NextResponse.json({ error: "Missing drop ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const parentCommentId =
      typeof body?.parentCommentId === "string" ? body.parentCommentId.trim() : null;
    if (!text) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    const dropExists = await query("SELECT id FROM drops WHERE id = $1", [
      dropId,
    ]);
    if (!dropExists.rows?.length) {
      return NextResponse.json({ error: "Drop not found" }, { status: 404 });
    }

    if (parentCommentId) {
      const parentRes = await query<{ id: string; parent_comment_id: string | null }>(
        `SELECT id, parent_comment_id FROM drop_comments WHERE id = $1 AND drop_id = $2`,
        [parentCommentId, dropId]
      );
      const parent = parentRes.rows?.[0];
      if (!parent) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
      if (parent.parent_comment_id) {
        return NextResponse.json(
          { error: "Nested replies limited to 1 level" },
          { status: 400 }
        );
      }
    }

    const insertRes = await query<{
      id: string;
      text: string;
      created_at: string;
    }>(
      `INSERT INTO drop_comments (drop_id, user_id, text, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, text, created_at`,
      [dropId, session.sub, text, parentCommentId]
    );
    const row = insertRes.rows?.[0];
    if (!row) {
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    const authorName = session.name ?? "You";
    return NextResponse.json({
      comment: {
        id: row.id,
        author: authorName,
        text: row.text,
        createdAt: "Just now",
        parentCommentId,
      },
    });
  } catch (e) {
    console.error("POST /api/drops/[dropId]/comments error:", e);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
