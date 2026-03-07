"use client";

import * as React from "react";
import { GitBranch, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export type VersionDisplayProps = {
  appVersion?: string | null;
  gitVersion?: string | null;
  aiVersion?: string | null;
  variant?: "compact" | "full";
  className?: string;
};

export function VersionDisplay({
  appVersion,
  gitVersion,
  aiVersion,
  variant = "full",
  className,
}: VersionDisplayProps) {
  const hasData = appVersion || gitVersion || aiVersion;

  if (!hasData) return null;

  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-[10px] text-white/45 sm:text-[11px]",
        compact && "gap-1.5",
        className
      )}
      title={`App: ${appVersion ?? "—"} • Git: ${gitVersion ?? "—"} • AI: ${aiVersion ?? "—"}`}
    >
      {appVersion && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5",
            compact && "px-1.5"
          )}
        >
          <span className="text-white/55">v{appVersion}</span>
        </span>
      )}
      {gitVersion && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5",
            compact && "px-1.5"
          )}
        >
          <GitBranch className="h-2.5 w-2.5 text-white/50" aria-hidden />
          <span className="font-mono text-white/55">{gitVersion}</span>
        </span>
      )}
      {aiVersion && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5",
            compact && "px-1.5"
          )}
        >
          <Cpu className="h-2.5 w-2.5 text-white/50" aria-hidden />
          <span className="text-white/55">{aiVersion}</span>
        </span>
      )}
    </div>
  );
}

export function useVersion() {
  const [version, setVersion] = React.useState<{
    appVersion: string | null;
    gitVersion: string | null;
    aiVersion: string | null;
  } | null>(null);

  React.useEffect(() => {
    fetch("/api/version")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setVersion({
            appVersion: data.appVersion ?? null,
            gitVersion: data.gitVersion ?? null,
            aiVersion: data.aiVersion ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  return version;
}
