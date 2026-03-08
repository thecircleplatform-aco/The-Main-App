"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/persona/me");
        if (res.status === 404 && !cancelled) {
          router.replace("/onboarding");
          return;
        }
      } catch {
        // If unauthenticated, middleware will redirect to login
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-hero" />
        <div className="relative flex min-h-dvh items-center justify-center">
          <p className="text-sm text-white/60">Loading…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-hero" />
      <div
        className="fixed inset-0 flex flex-col"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <ChatWindow />
      </div>
    </>
  );
}
