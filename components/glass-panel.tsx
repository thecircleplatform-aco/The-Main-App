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
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/6 shadow-soft backdrop-blur-2xl",
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
        "relative rounded-2xl border border-white/12 bg-white/4 shadow-soft backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

