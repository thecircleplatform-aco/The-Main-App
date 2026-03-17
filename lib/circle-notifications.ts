import { query } from "@/database/db";

export type NotificationType =
  | "circle_update"
  | "admin_announcement"
  | "mention"
  | "circle_invite";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  circleId?: string | null;
  title: string;
  content: string;
};

/**
 * Insert a single notification for a user.
 * Lightweight helper used by higher-level triggers.
 */
export async function createNotification(input: CreateNotificationInput) {
  const { userId, type, circleId, title, content } = input;
  await query(
    `INSERT INTO notifications (user_id, type, circle_id, title, content)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, circleId ?? null, title, content]
  );
}

/**
 * Create a notification for each member of a circle.
 * Uses a single INSERT ... SELECT for efficiency.
 */
export async function createCircleBroadcastNotification(params: {
  circleId: string;
  type: NotificationType;
  title: string;
  content: string;
}) {
  const { circleId, type, title, content } = params;
  await query(
    `INSERT INTO notifications (user_id, type, circle_id, title, content)
     SELECT cm.user_id, $1::text, $2::uuid, $3::text, $4::text
     FROM circle_members cm
     WHERE cm.circle_id = $2`,
    [type, circleId, title, content]
  );
}

