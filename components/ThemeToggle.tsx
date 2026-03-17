"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  size?: "sm" | "md";
};

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === "dark";

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg transition-colors",
        "border border-gray-200 bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900",
        "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-50",
        "dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-white/15 dark:focus:ring-offset-black/90",
        btnSize,
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className={iconSize} strokeWidth={1.75} />
      ) : (
        <Moon className={iconSize} strokeWidth={1.75} />
      )}
    </button>
  );
}
