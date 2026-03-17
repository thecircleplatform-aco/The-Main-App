"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { softSpring } from "@/lib/animations";

export type GlassSelectOption = { value: string; label: string };

export type GlassSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function GlassSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className,
}: GlassSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedLabel = value
    ? options.find((o) => o.value === value)?.label ?? value
    : placeholder;

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-left",
          "shadow-soft backdrop-blur-xl transition-all duration-200",
          open
            ? "border-gray-300 bg-gray-100 ring-2 ring-gray-300 ring-offset-2 ring-offset-gray-50 dark:border-white/40 dark:bg-white/15 dark:ring-white/25 dark:ring-offset-black/80"
            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-white/20 dark:bg-white/6 dark:hover:border-white/30 dark:hover:bg-white/8",
          value ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/50"
        )}
      >
        <span>{selectedLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={softSpring}
          className="shrink-0 text-gray-500 dark:text-white/70"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={softSpring}
            className="absolute top-full left-0 right-0 z-50 mt-2 max-h-56 overflow-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-xl backdrop-blur-2xl dark:border-white/25 dark:bg-gradient-to-b dark:from-[#1a1a2e] dark:to-[#0f0f1a] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_24px_48px_rgba(0,0,0,0.6),0_0_32px_rgba(139,92,246,0.15)]"
          >
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/90 dark:hover:bg-white/10 dark:hover:text-white",
                  !value && "bg-gray-100 text-gray-900 dark:bg-white/15 dark:text-white"
                )}
              >
                {placeholder}
              </button>
            </li>
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-white/10",
                    value === opt.value && "bg-gray-100 dark:bg-white/15"
                  )}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
