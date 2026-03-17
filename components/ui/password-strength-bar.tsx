"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getPasswordStrength,
  type PasswordStrengthResult,
} from "@/auth/validators/passwordStrength";

export type PasswordStrengthBarProps = {
  password: string;
  className?: string;
  showLabel?: boolean;
  showSuggestions?: boolean;
};

function getBarColor(percentage: number): string {
  if (percentage <= 20) return "bg-red-500";
  if (percentage <= 40) return "bg-orange-500";
  if (percentage <= 60) return "bg-amber-400";
  if (percentage <= 80) return "bg-blue-500";
  return "bg-emerald-500";
}

function getLabelColor(percentage: number): string {
  if (percentage <= 20) return "text-red-500 dark:text-red-400";
  if (percentage <= 40) return "text-orange-500 dark:text-orange-400";
  if (percentage <= 60) return "text-amber-600 dark:text-amber-400";
  if (percentage <= 80) return "text-blue-600 dark:text-blue-400";
  return "text-emerald-600 dark:text-emerald-400";
}

export function PasswordStrengthBar({
  password,
  className,
  showLabel = true,
  showSuggestions = true,
}: PasswordStrengthBarProps) {
  const result: PasswordStrengthResult = React.useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const isEmpty = !password.trim();
  const percentage = isEmpty ? 0 : result.percentage;
  const barColor = getBarColor(percentage);
  const labelColor = getLabelColor(percentage);

  return (
    <div className={cn("space-y-1.5", className)}>
      {!isEmpty && (
        <>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/15">
              <motion.div
                className={cn("h-full rounded-full", barColor)}
                initial={false}
                animate={{ width: `${percentage}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
            {showLabel && (
              <span
                className={cn(
                  "min-w-[4.5rem] text-xs font-medium",
                  labelColor
                )}
              >
                {result.label}
              </span>
            )}
          </div>
          {showSuggestions && result.suggestions.length > 0 && (
            <ul className="text-xs text-gray-500 dark:text-white/50" role="list">
              {result.suggestions.slice(0, 3).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
