"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const INTEREST_OPTIONS = [
  "technology",
  "sports",
  "business",
  "music",
  "art",
  "science",
  "relationships",
  "learning",
] as const;

export type InterestValue = (typeof INTEREST_OPTIONS)[number];

export type InterestSelectorProps = {
  value: InterestValue[];
  onChange: (selected: InterestValue[]) => void;
  disabled?: boolean;
  className?: string;
};

export function InterestSelector({
  value,
  onChange,
  disabled = false,
  className,
}: InterestSelectorProps) {
  const toggle = (interest: InterestValue) => {
    if (disabled) return;
    const next = value.includes(interest)
      ? value.filter((i) => i !== interest)
      : [...value, interest];
    onChange(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((interest) => {
          const selected = value.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              disabled={disabled}
              onClick={() => toggle(interest)}
              className={cn(
                "rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all backdrop-blur-xl",
                "focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-white/25",
                selected
                  ? "border-violet-400 bg-violet-100 text-violet-900 shadow-soft dark:border-white/25 dark:bg-white/15 dark:text-white"
                  : "border-violet-200/80 bg-violet-50/50 text-violet-800 hover:border-violet-300 hover:bg-violet-100/80 hover:text-violet-900 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/8 dark:hover:text-white"
              )}
            >
              {interest.charAt(0).toUpperCase() + interest.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
