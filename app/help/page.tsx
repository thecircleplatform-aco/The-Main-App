"use client";

import * as React from "react";
import { SupportChat } from "@/components/helpcenter/SupportChat";
import { GlassPanel } from "@/components/glass-panel";
import { GalaxyPageWrapper } from "@/components/GalaxyPageWrapper";
import Link from "next/link";

export default function HelpPage() {
  return (
    <GalaxyPageWrapper>
      <div className="min-h-dvh px-4 pb-20 pt-14 md:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-8">
          <GlassPanel className="p-6 text-center">
            <h1 className="text-xl font-semibold text-white">Support Center</h1>
            <p className="mt-1 text-sm text-white/60">
              You appear to be blocked due to unusual activity. Please contact
              support if you believe this is a mistake.
            </p>
          </GlassPanel>

          <SupportChat />

          <p className="text-center">
            <Link
              href="/login"
              className="text-sm text-white/50 hover:text-white/70"
            >
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </GalaxyPageWrapper>
  );
}
