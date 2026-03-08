"use client";

import { GalaxyBackground } from "@/components/onboarding/GalaxyBackground";

export function GalaxyPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GalaxyBackground />
      <div className="relative">{children}</div>
    </>
  );
}
