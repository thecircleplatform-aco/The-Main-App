"use client";

import * as React from "react";
import { clearSessionAndRedirectToLogin } from "@/lib/logout";

export type Session = {
  id: string;
  email: string;
  name?: string;
} | null;

export function useSession(): { session: Session; loading: boolean } {
  const [session, setSession] = React.useState<Session>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 401) {
          void clearSessionAndRedirectToLogin(
            typeof window !== "undefined" ? window.location.pathname || "/" : "/"
          );
          return null;
        }
        if (res.status === 403) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        if (data.id) {
          setSession({
            id: data.id,
            email: data.email ?? "",
            name: data.name,
          });
        } else {
          setSession(null);
        }
      })
      .catch(() => setSession(null))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, loading };
}
