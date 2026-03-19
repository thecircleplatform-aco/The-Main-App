"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // In dev, a SW frequently caches stale `/_next/static/*` asset URLs which then
    // causes long 404 stalls and RSC client-manifest errors. Ensure it's disabled.
    if (process.env.NODE_ENV !== "production") {
      (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {
          // Best-effort cleanup; ignore.
        }
      })();
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Service worker registration failed", err);
      }
    };

    register();
  }, []);

  return null;
}

