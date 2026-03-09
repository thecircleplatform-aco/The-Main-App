/**
 * Capacitor utilities - detect native platform and safely use plugins.
 * Use dynamic imports to avoid SSR issues and allow web fallbacks.
 */

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === "function" && cap.isNativePlatform();
}

export async function getCamera() {
  if (!isNative()) return null;
  try {
    return await import("@capacitor/camera");
  } catch {
    return null;
  }
}

export async function getHaptics() {
  if (!isNative()) return null;
  try {
    return await import("@capacitor/haptics");
  } catch {
    return null;
  }
}

export async function getShare() {
  if (!isNative()) return null;
  try {
    return await import("@capacitor/share");
  } catch {
    return null;
  }
}

export async function getClipboard() {
  if (!isNative()) return null;
  try {
    return await import("@capacitor/clipboard");
  } catch {
    return null;
  }
}

export async function hapticImpact() {
  const h = await getHaptics();
  if (h?.Haptics && h?.ImpactStyle) {
    try {
      await h.Haptics.impact({ style: h.ImpactStyle.Light });
    } catch {
      /* ignore */
    }
  }
}

export async function hapticNotify(type?: "success" | "warning" | "error") {
  const h = await getHaptics();
  if (h?.Haptics && h?.NotificationType) {
    try {
      const style =
        type === "success"
          ? h.NotificationType.Success
          : type === "warning"
            ? h.NotificationType.Warning
            : h.NotificationType.Error;
      await h.Haptics.notification({ type: style });
    } catch {
      await hapticImpact();
    }
  }
}
