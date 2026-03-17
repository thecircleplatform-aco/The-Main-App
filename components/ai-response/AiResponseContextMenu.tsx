"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Languages, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/capacitor";

const MENU_WIDTH = 180;
const PADDING = 8;

function constrainToViewport(x: number, y: number) {
  const w = typeof window !== "undefined" ? window.innerWidth : 400;
  const h = typeof window !== "undefined" ? window.innerHeight : 600;
  const left = Math.max(PADDING, Math.min(x, w - MENU_WIDTH - PADDING));
  const top = Math.max(PADDING, Math.min(y, h - 180 - PADDING));
  return { left, top };
}

export type AiResponseContextMenuProps = {
  selectedText: string;
  menuPos: { left: number; top: number };
  onClose: () => void;
  onCopy?: () => void;
  onTranslate?: (text: string) => void;
  onAskAi?: (text: string) => void;
  className?: string;
};

export function AiResponseContextMenu({
  selectedText,
  menuPos,
  onClose,
  onCopy,
  onTranslate,
  onAskAi,
  className,
}: AiResponseContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const { left, top } = constrainToViewport(menuPos.left, menuPos.top);

  const handleCopy = React.useCallback(() => {
    hapticImpact();
    if (typeof navigator?.clipboard?.writeText === "function" && selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => {});
    }
    onCopy?.();
    onClose();
  }, [selectedText, onCopy, onClose]);

  const handleTranslate = React.useCallback(() => {
    hapticImpact();
    onTranslate?.(selectedText);
    onClose();
  }, [selectedText, onTranslate, onClose]);

  const handleAskAi = React.useCallback(() => {
    hapticImpact();
    onAskAi?.(selectedText);
    onClose();
  }, [selectedText, onAskAi, onClose]);

  React.useEffect(() => {
    function closeOnClickOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function closeOnEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", closeOnClickOutside);
    document.addEventListener("touchstart", closeOnClickOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnClickOutside);
      document.removeEventListener("touchstart", closeOnClickOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "fixed z-50 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-black/95 py-1 shadow-xl backdrop-blur-2xl",
        className
      )}
      style={{ left, top }}
    >
      <button
        type="button"
        onClick={handleCopy}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
      >
        <Copy className="h-4 w-4 text-white/60" />
        Copy
      </button>
      <button
        type="button"
        onClick={handleTranslate}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
      >
        <Languages className="h-4 w-4 text-white/60" />
        Translate
      </button>
      {onAskAi && (
        <button
          type="button"
          onClick={handleAskAi}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
        >
          <MessageCircle className="h-4 w-4 text-white/60" />
          Ask AI about this text
        </button>
      )}
    </motion.div>
  );
}
