"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/navigation/Header";
import { FooterNav } from "@/components/navigation/FooterNav";
import { cn } from "@/lib/utils";

type Props = { children: React.ReactNode };

export function MainAppFrame({ children }: Props) {
  const [immersive, setImmersive] = React.useState(false);
  const pathname = usePathname() || "/";
  const dropsRoute = pathname === "/drops" || pathname.startsWith("/drops/");
  const circleChatRoute = pathname.startsWith("/circles/") && pathname !== "/circles";
  const hideFooterNav = immersive || dropsRoute || circleChatRoute;

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ enabled?: boolean }>;
      setImmersive(!!ev.detail?.enabled);
    };
    window.addEventListener("drops-video-mode-changed", handler as EventListener);
    return () =>
      window.removeEventListener(
        "drops-video-mode-changed",
        handler as EventListener
      );
  }, []);

  React.useEffect(() => {
    if (pathname !== "/drops") setImmersive(false);
  }, [pathname]);

  React.useEffect(() => {
    // Prevent background scroll in fullscreen player mode.
    const html = document.documentElement;
    const body = document.body;
    if (!immersive) {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.overscrollBehaviorY = "";
      return;
    }
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehaviorY = "none";
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.overscrollBehaviorY = "";
    };
  }, [immersive]);

  return (
    <div
      className={cn(
        "min-h-dvh w-full bg-white text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100",
        immersive && "p-0"
      )}
      style={{
        paddingTop:
          immersive || dropsRoute ? 0 : "calc(56px + env(safe-area-inset-top))",
        paddingBottom:
          hideFooterNav ? 0 : "calc(64px + env(safe-area-inset-bottom))",
      }}
    >
      <Header />

      <main
        className={cn(
          "mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-4",
          (immersive || dropsRoute) && "max-w-none px-0 py-0"
        )}
      >
        {children}
      </main>

      {!hideFooterNav && <FooterNav />}
    </div>
  );
}

