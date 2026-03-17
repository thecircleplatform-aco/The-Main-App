import { query } from "@/database/db";
import { subscribe as subscribeBroadcast } from "@/lib/circle-messages-broadcast";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 50;

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

type Row = {
  id: string;
  circle_id: string;
  channel_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
  user_name: string | null;
};

/**
 * GET /api/circle-messages/stream?circleSlug=bts&channel=general
 * Server-Sent Events: sends initial history then pushes new messages in real time.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const circleSlug = searchParams.get("circleSlug")?.trim() ?? "";
  const channel = searchParams.get("channel")?.trim() ?? "";

  if (!circleSlug || !isValidSlug(circleSlug)) {
    return new Response("Invalid circleSlug", { status: 400 });
  }
  if (!channel || !isValidSlug(channel)) {
    return new Response("Invalid channel", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const circleRes = await query<{ id: string }>(
          "SELECT id FROM circles WHERE slug = $1",
          [circleSlug]
        );
        const circle = circleRes.rows[0];
        if (!circle) {
          send("error", { message: "Circle not found" });
          controller.close();
          return;
        }

        const channelRes = await query<{ id: string }>(
          "SELECT id FROM circle_channels WHERE circle_id = $1 AND slug = $2",
          [circle.id, channel]
        );
        const ch = channelRes.rows[0];
        if (!ch) {
          send("error", { message: "Channel not found" });
          controller.close();
          return;
        }

        const historyRes = await query<Row>(
          `SELECT m.id, m.circle_id, m.channel_id, m.user_id, m.message_text, m.created_at, u.name AS user_name
           FROM circle_messages m
           LEFT JOIN users u ON u.id = m.user_id
           WHERE m.channel_id = $1
           ORDER BY m.created_at DESC
           LIMIT $2`,
          [ch.id, HISTORY_LIMIT]
        );
        const history = (historyRes.rows || []).map((r) => ({
          id: r.id,
          circle_id: r.circle_id,
          channel_id: r.channel_id,
          user_id: r.user_id,
          username: r.user_name ?? "Anonymous",
          message_text: r.message_text,
          created_at: r.created_at,
        }));
        send("history", { messages: history.reverse() });

        const unsubscribe = subscribeBroadcast(circleSlug, channel, (payload) => {
          send("message", payload);
        });

        request.signal.addEventListener("abort", () => {
          unsubscribe();
          controller.close();
        });
      } catch (e) {
        console.error("SSE circle-messages/stream error:", e);
        send("error", { message: "Server error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache",
      Connection: "keep-alive",
    },
  });
}
