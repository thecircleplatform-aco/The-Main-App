"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";

export type TypingIndicatorProps = {
  visible?: boolean;
  className?: string;
};

/**
 * Shows "Circle is typing..." when the AI begins generating a response.
 * Disappears when streaming begins.
 */
export function TypingIndicator({
  visible = true,
  className,
}: TypingIndicatorProps) {
  if (!visible) return null;

  return (
    <motion.div
      key="typing"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn("flex items-center gap-2 text-[11px] text-white/55", className)}
    >
      <div className="flex h-7 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 backdrop-blur-xl">
        <span
          className={cn(
            "h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
          )}
        />
        <span className="inline-flex gap-0.5">
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-white/60"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-white/50"
            style={{ animationDelay: "100ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-white/40"
            style={{ animationDelay: "200ms" }}
          />
        </span>
      </div>
      <span>Circle is typing...</span>
    </motion.div>
  );
}
