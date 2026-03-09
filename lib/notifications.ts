/**
 * Push and Local Notifications - native plugins.
 * Use only when running in Capacitor.
 */

import { isNative } from "./capacitor";

export async function registerPushNotifications(): Promise<void> {
  if (!isNative()) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive === "granted") {
      await PushNotifications.register();
    }
  } catch {
    /* ignore */
  }
}

export async function addPushListeners(callbacks: {
  onRegistration?: (token: { value: string }) => void;
  onRegistrationError?: (error: unknown) => void;
  onPushReceived?: (notification: unknown) => void;
  onPushActionPerformed?: (action: unknown) => void;
}): Promise<() => void> {
  if (!isNative()) return () => {};
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const reg = await PushNotifications.addListener(
      "registration",
      callbacks.onRegistration ?? (() => {})
    );
    const regErr = await PushNotifications.addListener(
      "registrationError",
      callbacks.onRegistrationError ?? (() => {})
    );
    const pushRec = await PushNotifications.addListener(
      "pushNotificationReceived",
      callbacks.onPushReceived ?? (() => {})
    );
    const pushAct = await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      callbacks.onPushActionPerformed ?? (() => {})
    );
    return () => {
      reg.remove();
      regErr.remove();
      pushRec.remove();
      pushAct.remove();
    };
  } catch {
    return () => {};
  }
}

export async function requestLocalNotificationPermissions(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === "granted";
  } catch {
    return false;
  }
}

export async function ensureLocalNotificationChannel(): Promise<void> {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.createChannel({
      id: "circle-reminders",
      name: "Circle Reminders",
      description: "AI reminders, check-ins, and goal updates",
      importance: 4,
    });
  } catch {
    /* ignore */
  }
}

export async function scheduleLocalNotification(options: {
  id: number;
  title: string;
  body: string;
  schedule?: { at: Date };
  channelId?: string;
}): Promise<void> {
  if (!isNative()) return;
  try {
    await ensureLocalNotificationChannel();
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [
        {
          id: options.id,
          title: options.title,
          body: options.body,
          schedule: options.schedule,
          channelId: options.channelId ?? "circle-reminders",
        },
      ],
    });
  } catch {
    /* ignore */
  }
}
