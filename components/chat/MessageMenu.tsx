"use client";

import * as React from "react";
import { MoreHorizontal, Bookmark, Flag, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type MessageMenuProps = {
  onSave?: () => void;
  onReport?: () => void;
  onHide?: () => void;
  className?: string;
};

/**
 * Three-dot menu with Save message, Report issue, Hide message.
 */
export function MessageMenu({
  onSave,
  onReport,
  onHide,
  className,
}: MessageMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="More options"
        aria-expanded={open}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors",
          "hover:bg-white/10 hover:text-white/80"
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-black/90 py-1 shadow-xl backdrop-blur-2xl"
          >
            {onSave && (
              <button
                type="button"
                onClick={() => {
                  onSave();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Bookmark className="h-4 w-4 text-white/60" />
                Save message
              </button>
            )}
            {onReport && (
              <button
                type="button"
                onClick={() => {
                  onReport();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Flag className="h-4 w-4 text-white/60" />
                Report issue
              </button>
            )}
            {onHide && (
              <button
                type="button"
                onClick={() => {
                  onHide();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <EyeOff className="h-4 w-4 text-white/60" />
                Hide message
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
