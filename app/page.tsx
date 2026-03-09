"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/persona/me");
        if (cancelled) return;
        if (res.status === 404) {
          router.replace("/onboarding");
        }
      } catch {
        // Show chat anyway; auth will redirect from ChatWindow if needed
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

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
