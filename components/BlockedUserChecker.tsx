"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

const HELP_PATH = "/help";

export function BlockedUserChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (pathname === HELP_PATH || pathname.startsWith("/login") || pathname.startsWith("/register")) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    fetch("/api/me")
      .then((res) => {
        if (cancelled) return;
        if (res.status === 403) {
          return res.json().then((data) => {
            if (data?.blocked && !cancelled) {
              router.replace(HELP_PATH);
            }
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}
