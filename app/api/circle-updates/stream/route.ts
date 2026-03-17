import { query } from "@/database/db";
import { subscribeCircleUpdates } from "@/lib/circle-updates-notify";

export const dynamic = "force-dynamic";

function isValidSlug(s: string): boolean {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length <= 200;
}

/**
 * GET /api/circle-updates/stream?circleSlug=ronaldo
 * SSE: sends "new_update" when an update is posted to this circle.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const circleSlug = searchParams.get("circleSlug")?.trim() ?? "";

  if (!circleSlug || !isValidSlug(circleSlug)) {
    return new Response("Invalid circleSlug", { status: 400 });
  }

  const circleRes = await query<{ id: string; name: string }>(
    "SELECT id, name FROM circles WHERE slug = $1",
    [circleSlug]
  );
  const circle = circleRes.rows[0];
  if (!circle) {
    return new Response("Circle not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const unsubscribe = subscribeCircleUpdates((payload) => {
        if (payload.circleId === circle.id) {
          send("new_update", {
            message: `New update in ${payload.circleName}.`,
            title: payload.title,
          });
        }
      });

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
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
