"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp, softSpring } from "@/lib/animations";

export type StreamingMessageProps = {
  content: string;
  agentName?: string;
  createdAt?: string;
  isStreaming?: boolean;
  accent?: "cyan" | "violet" | "amber" | "emerald" | "rose";
  /** Render action bar below the message */
  actionSlot?: React.ReactNode;
  /** Typewriter speed in ms per character (0 = no typewriter, show immediately) */
  typewriterSpeed?: number;
};

const DEFAULT_TYPEWRITER_MS = 10;

/**
 * Renders AI message text progressively. Plain text without bubble; typewriter effect.
 */
/** Reveals text progressively for a typewriter effect. */
function useTypewriter(target: string, speedMs: number): string {
  const [displayed, setDisplayed] = React.useState("");
  React.useEffect(() => {
    if (speedMs <= 0) {
      setDisplayed(target);
      return;
    }
    let cancel = false;
    const run = () => {
      setDisplayed((prev) => {
        if (cancel || prev.length >= target.length) return prev;
        return target.slice(0, prev.length + 1);
      });
    };
    const id = setInterval(run, speedMs);
    return () => {
      cancel = true;
      clearInterval(id);
    };
  }, [target, speedMs]);

  return speedMs <= 0 ? target : displayed;
}

export function StreamingMessage({
  content,
  agentName = "Circle",
  createdAt,
  isStreaming = false,
  accent = "violet",
  actionSlot,
  typewriterSpeed = DEFAULT_TYPEWRITER_MS,
}: StreamingMessageProps) {
  const effectiveSpeed = isStreaming ? 0 : typewriterSpeed;
  const displayedContent = useTypewriter(content, effectiveSpeed);

  return (
    <motion.div
      layout
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ ...softSpring, mass: 0.6 }}
      className="flex w-full gap-3"
    >
      <motion.div
        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xs font-semibold text-white/90 shadow-soft backdrop-blur-xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={softSpring}
      >
        {(agentName ?? "AI")
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </motion.div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-sm leading-relaxed text-white/90">
          {displayedContent || isStreaming || content ? (
            <>
              {displayedContent.split("\n").map((line, idx) => (
                <p
                  key={idx}
                  className={cn(
                    "whitespace-pre-wrap",
                    idx > 0 ? "mt-1" : undefined
                  )}
                >
                  {line}
                </p>
              ))}
              {(isStreaming || displayedContent.length < content.length) && (
                <span
                  className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/70"
                  aria-hidden
                />
              )}
            </>
          ) : null}
        </div>

        {(agentName || createdAt || actionSlot) && (
          <div className="mt-1 flex flex-col gap-1 pl-1">
            <div className="flex items-center gap-x-3 text-[11px] text-white/40">
              {agentName && <span>{agentName}</span>}
              {createdAt && (
                <span>
                  {new Date(createdAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            {actionSlot && <div className="w-full">{actionSlot}</div>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
