import * as React from "react";
import { cn } from "@/lib/utils";

export type GlassProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Primary glassmorphism container used throughout the app.
 * Rounded, softly glowing, with strong backdrop blur.
 */
export function GlassPanel({ className, ...props }: GlassProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-violet-200/70 bg-white/95 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-white/6",
        className
      )}
      {...props}
    />
  );
}

/**
 * Lighter-weight glass card for smaller sections, list items, and legal content.
 */
export function GlassCard({ className, ...props }: GlassProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-cyan-200/60 bg-white/90 shadow-soft backdrop-blur-xl dark:border-white/12 dark:bg-white/4",
        className
      )}
      {...props}
    />
  );
}

