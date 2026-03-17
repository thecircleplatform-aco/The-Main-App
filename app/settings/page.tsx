import Link from "next/link";
import { SettingsView } from "@/components/settings/SettingsView";
import { ArrowLeft } from "lucide-react";
import { InteractiveBackground } from "@/components/background/InteractiveBackground";

export default function SettingsPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-transparent">
      {/* Shared interactive grid background behind settings content */}
      <InteractiveBackground maxIcons={14} />

      <header className="relative z-10 flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white/90 px-4 py-3 dark:border-white/[0.08] dark:bg-black/90 sm:px-5 sm:py-3">
        <Link
          href="/"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100/80 text-gray-600 transition-colors hover:bg-gray-200/80 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-white/15 dark:focus:ring-offset-black/90"
          aria-label="Back to chat"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-white/90 sm:text-base">
            Settings
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-white/50 sm:text-xs">
            Circle preferences
          </p>
        </div>
      </header>
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto max-w-3xl">
          <SettingsView />
        </div>
      </main>
    </div>
  );
}
