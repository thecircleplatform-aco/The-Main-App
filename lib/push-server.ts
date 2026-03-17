import { query } from "@/database/db";
import type { NotificationType } from "./circle-notifications";

const FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send";

function getServerKey(): string | null {
  return process.env.FIREBASE_SERVER_KEY ?? null;
}

async function getUserPushSettings(userId: string) {
  const res = await query<{
    mentions_enabled: boolean;
    updates_enabled: boolean;
  }>(
    `
    SELECT mentions_enabled, updates_enabled
    FROM user_notification_settings
    WHERE user_id = $1
    `,
    [userId]
  );

  if (!res.rows[0]) {
    return { mentionsEnabled: true, updatesEnabled: true };
  }
  const row = res.rows[0];
  return {
    mentionsEnabled: row.mentions_enabled,
    updatesEnabled: row.updates_enabled,
  };
}

async function getUserTokens(userId: string) {
  const res = await query<{ device_token: string }>(
    `
    SELECT device_token
    FROM device_tokens
    WHERE user_id = $1
    `,
    [userId]
  );
  return res.rows.map((r) => r.device_token);
}

async function sendFcmToToken(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>
) {
  const key = getServerKey();
  if (!key) return;

  try {
    await fetch(FCM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${key}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
        },
        data,
      }),
    });
  } catch (e) {
    console.warn("FCM send error", e);
  }
}

export async function sendPushForNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const { userId, type, title, body, data = {} } = params;

  const settings = await getUserPushSettings(userId);
  if (type === "mention" && !settings.mentionsEnabled) return;
  if ((type === "circle_update" || type === "admin_announcement") && !settings.updatesEnabled) {
    return;
  }

  const tokens = await getUserTokens(userId);
  if (tokens.length === 0) return;

  await Promise.all(
    tokens.map((t) =>
      sendFcmToToken(t, title, body, {
        ...data,
        notificationType: type,
      })
    )
  );
}

