import Link from "next/link";
import { SettingsView } from "@/components/settings/SettingsView";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-black/95">
      <header className="flex shrink-0 items-center gap-2 border-b border-white/[0.08] bg-black/90 px-4 py-3 sm:px-5 sm:py-3">
        <Link
          href="/"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/15 focus:ring-offset-2 focus:ring-offset-black/90"
          aria-label="Back to chat"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-white/90 sm:text-base">
            Settings
          </h1>
          <p className="text-[11px] text-white/50 sm:text-xs">
            Circle preferences
          </p>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto max-w-3xl">
          <SettingsView />
        </div>
      </main>
    </div>
  );
}
