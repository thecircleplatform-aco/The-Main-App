/**
 * Notify circle members when an update is posted.
 * Uses in-memory broadcast (SSE) so active viewers see the notification.
 * For push/email you would integrate with your notification service here.
 */

import { query } from "@/database/db";
import { sendPushForNotification } from "./push-server";
import type { NotificationType } from "./circle-notifications";

type Listener = (payload: { circleId: string; circleName: string; title: string }) => void;
const listeners = new Set<Listener>();

export function subscribeCircleUpdates(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function broadcastCircleUpdate(
  circleId: string,
  circleName: string,
  title: string
): void {
  const payload = { circleId, circleName, title };
  for (const fn of listeners) {
    try {
      fn(payload);
    } catch (e) {
      console.warn("Circle update listener error:", e);
    }
  }
}

/**
 * Notify circle members about a new update.
 * - Broadcasts to SSE subscribers (e.g. "New update in Ronaldo Circle.")
 * - Could be extended to push notifications or emails.
 */
export async function notifyCircleUpdate(
  circleId: string,
  circleName: string,
  title: string
): Promise<void> {
  broadcastCircleUpdate(circleId, circleName, title);

  const memberRes = await query<{ user_id: string }>(
    "SELECT user_id FROM circle_members WHERE circle_id = $1",
    [circleId]
  );

  const nType: NotificationType = "circle_update";

  await Promise.all(
    memberRes.rows.map((row) =>
      sendPushForNotification({
        userId: row.user_id,
        type: nType,
        title: "Circle Update",
        body: `New update in ${circleName}: ${title}`,
        data: {
          circleId,
          route: "/notifications",
        },
      })
    )
  );
}
