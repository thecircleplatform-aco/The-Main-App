"use client";

import * as React from "react";
import { isNative } from "@/lib/capacitor";
import { registerPushNotifications } from "@/lib/notifications";

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (!isNative()) return;

    const init = async () => {
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }

      try {
        await registerPushNotifications();
      } catch {
        /* ignore */
      }
    };

    void init();
  }, []);

  return <>{children}</>;
}
