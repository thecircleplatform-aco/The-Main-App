"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TranslatedBlockProps = {
  /** Original text */
  original: string;
  /** Translated text (shown below original) */
  translated: string;
  /** Target language code (e.g. "es") */
  targetLang?: string;
  /** Optional loading state */
  loading?: boolean;
  onClose?: () => void;
  className?: string;
};

/** Non-destructive translation: shows translated text below the original. */
export function TranslatedBlock({
  original,
  translated,
  targetLang,
  loading,
  onClose,
  className,
}: TranslatedBlockProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60",
          className
        )}
      >
        <span className="animate-pulse">Translating…</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mt-2 space-y-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2",
        className
      )}
    >
      {targetLang && (
        <p className="text-[10px] font-medium uppercase tracking-wide text-white/45">
          Translation ({targetLang})
        </p>
      )}
      <p className="text-sm leading-relaxed text-white/80">{translated}</p>
    </motion.div>
  );
}
