/**
 * Push Notifications for Capacitor (mobile only).
 * - Requests permissions
 * - Registers with FCM/APNs via Capacitor PushNotifications
 * - Sends device token to backend
 * - Handles foreground notifications and tap actions
 */

import { isNative } from "./capacitor";

let initialized = false;

type PushPlatform = "android" | "ios" | "web";

async function getPlatform(): Promise<PushPlatform> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    const p = Capacitor.getPlatform();
    if (p === "android") return "android";
    if (p === "ios") return "ios";
    return "web";
  } catch {
    return "web";
  }
}

async function sendTokenToBackend(token: string, platform: PushPlatform) {
  try {
    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token, platform }),
    });
  } catch {
    // non-fatal
  }
}

export async function registerPushNotifications(): Promise<void> {
  if (!isNative()) return;
  if (initialized) return;
  initialized = true;

  try {
    const [{ PushNotifications }, platform] = await Promise.all([
      import("@capacitor/push-notifications"),
      getPlatform(),
    ]);

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") {
      return;
    }

    await PushNotifications.register();

    await PushNotifications.addListener("registration", async (token) => {
      await sendTokenToBackend(token.value, platform);
    });

    await PushNotifications.addListener("registrationError", (error) => {
      console.warn("Push registration error", error);
    });

    await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Push received (foreground)", notification);
      }
    );

    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const data = action.notification?.data ?? {};
        if (typeof window === "undefined") return;

        if (data.circleSlug && data.channelSlug) {
          window.location.href = `/circles/${data.circleSlug}?channel=${data.channelSlug}`;
        } else if (data.route) {
          window.location.href = String(data.route);
        } else {
          window.location.href = "/notifications";
        }
      }
    );
  } catch (e) {
    console.warn("Failed to initialize push notifications", e);
  }
}

