import { NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { query } from "@/database/db";
import { broadcast } from "@/lib/circle-messages-broadcast";
import { createNotification, type NotificationType } from "@/lib/circle-notifications";
import { sendPushForNotification } from "@/lib/push-server";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 1;
const SPAM_WINDOW_MS = 2000;
const SPAM_MAX_COUNT = 3;

/** Allow only safe slug characters */
function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

type CircleChannelRow = { id: string; circle_id: string };
type MessageRow = {
  id: string;
  circle_id: string;
  channel_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
};
type UserRow = { name: string | null };
type MentionRow = { id: string; name: string | null };

// Simple in-memory spam throttle per user (no auth change)
const lastSentByUser = new Map<string, number[]>();
function isSpam(userId: string): boolean {
  const now = Date.now();
  let times = lastSentByUser.get(userId) ?? [];
  times = times.filter((t) => now - t < SPAM_WINDOW_MS);
  if (times.length >= SPAM_MAX_COUNT) return true;
  times.push(now);
  lastSentByUser.set(userId, times);
  return false;
}

function extractMentions(message: string): string[] {
  const matches = message.match(/@([a-zA-Z0-9_]{2,32})/g);
  if (!matches) return [];
  const names = matches.map((m) => m.slice(1));
  return Array.from(new Set(names));
}

/**
 * POST /api/circle-messages/send
 * Body: { circleSlug, channel, message }
 * Requires session. User must be a member of the circle.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.sub;

    if (isSpam(userId)) {
      return NextResponse.json(
        { error: "Please wait a moment before sending again." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const circleSlug =
      typeof body?.circleSlug === "string" ? body.circleSlug.trim() : "";
    const channelSlug =
      typeof body?.channel === "string" ? body.channel.trim() : "";
    let message =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (!circleSlug || !isValidSlug(circleSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing circleSlug" },
        { status: 400 }
      );
    }
    if (!channelSlug || !isValidSlug(channelSlug)) {
      return NextResponse.json(
        { error: "Invalid or missing channel" },
        { status: 400 }
      );
    }
    if (message.length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    const circleRes = await query<{ id: string }>(
      "SELECT id FROM circles WHERE slug = $1",
      [circleSlug]
    );
    const circle = circleRes.rows[0];
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const memberRes = await query(
      "SELECT 1 FROM circle_members WHERE circle_id = $1 AND user_id = $2",
      [circle.id, userId]
    );
    if (memberRes.rows.length === 0) {
      return NextResponse.json(
        { error: "You must join the circle to send messages" },
        { status: 403 }
      );
    }

    const channelRes = await query<CircleChannelRow>(
      "SELECT id, circle_id FROM circle_channels WHERE circle_id = $1 AND slug = $2",
      [circle.id, channelSlug]
    );
    const channel = channelRes.rows[0];
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const insertRes = await query<MessageRow>(
      `INSERT INTO circle_messages (circle_id, channel_id, user_id, message_text)
       VALUES ($1, $2, $3, $4)
       RETURNING id, circle_id, channel_id, user_id, message_text, created_at`,
      [channel.circle_id, channel.id, userId, message]
    );
    const row = insertRes.rows[0];
    if (!row) {
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    const userRes = await query<UserRow>(
      "SELECT name FROM users WHERE id = $1",
      [userId]
    );
    const username =
      userRes.rows[0]?.name ?? session.name ?? session.email ?? "Anonymous";

    // Mention notifications (lightweight, rate-limited by message size)
    const mentionNames = extractMentions(message);
    if (mentionNames.length > 0) {
      const mentionRows = await query<MentionRow>(
        `SELECT id, name FROM users WHERE name = ANY($1::text[])`,
        [mentionNames]
      );
      const mentionedIds = new Set<string>();
      for (const row of mentionRows.rows) {
        if (!row.id || row.id === userId) continue;
        if (mentionedIds.has(row.id)) continue;
        mentionedIds.add(row.id);
        const nType: NotificationType = "mention";
        const notifTitle = `You were mentioned in ${circleSlug} circle`;
        const notifContent = message.slice(0, 200);

        await createNotification({
          userId: row.id,
          type: nType,
          circleId: circle.id,
          title: notifTitle,
          content: notifContent,
        });

        await sendPushForNotification({
          userId: row.id,
          type: nType,
          title: "You were mentioned",
          body: `@${row.name ?? "you"} someone mentioned you in ${circleSlug} circle`,
          data: {
            circleSlug,
            channelSlug,
          },
        });
      }
    }

    const payload = {
      id: row.id,
      circle_id: row.circle_id,
      channel_id: row.channel_id,
      user_id: row.user_id,
      username,
      message_text: row.message_text,
      created_at: row.created_at,
    };
    broadcast(circleSlug, channelSlug, payload);

    return NextResponse.json({
      success: true,
      message: {
        id: payload.id,
        username: payload.username,
        message_text: payload.message_text,
        created_at: payload.created_at,
      },
    });
  } catch (e) {
    console.error("POST /api/circle-messages/send error:", e);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
