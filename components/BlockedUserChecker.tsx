"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const HELP_PATH = "/help";

export function BlockedUserChecker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (pathname === HELP_PATH || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/terms") || pathname.startsWith("/privacy") || pathname.startsWith("/ai-policy")) {
      return;
    }
    let cancelled = false;
    fetch("/api/me")
      .then((res) => {
        if (cancelled) return;
        if (res.status === 403) {
          return res.json().then((data) => {
            if (data?.blocked && !cancelled) {
              window.location.replace(HELP_PATH);
            }
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return <>{children}</>;
}
