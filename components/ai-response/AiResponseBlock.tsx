"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { AiResponseContextMenu } from "./AiResponseContextMenu";
import { TranslatedBlock } from "./TranslatedBlock";
import { cn } from "@/lib/utils";

export type AiResponseBlockProps = {
  children: React.ReactNode;
  /** Callback when user selects text and chooses action */
  onTranslate?: (text: string) => void | Promise<void>;
  onAskAi?: (text: string) => void;
  /** Enable right-click / long-press context menu on AI text */
  enableContextMenu?: boolean;
  /** User-select to allow text selection */
  selectable?: boolean;
  className?: string;
};

export function AiResponseBlock({
  children,
  onTranslate,
  onAskAi,
  enableContextMenu = true,
  selectable = true,
  className,
}: AiResponseBlockProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState({ left: 0, top: 0 });
  const [selectedText, setSelectedText] = React.useState("");
  const [translation, setTranslation] = React.useState<{
    original: string;
    translated: string;
    targetLang: string;
  } | null>(null);
  const [translateLoading, setTranslateLoading] = React.useState(false);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionAnchorRef = React.useRef<{ x: number; y: number } | null>(null);

  const openMenu = React.useCallback((clientX: number, clientY: number, text: string) => {
    if (!text.trim() || !enableContextMenu) return;
    setSelectedText(text.trim());
    setMenuPos({ left: clientX, top: clientY });
    setMenuOpen(true);
  }, [enableContextMenu]);

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      if (!enableContextMenu) return;
      const sel = window.getSelection?.();
      const text = sel?.toString?.()?.trim() ?? "";
      if (!text) return;
      e.preventDefault();
      openMenu(e.clientX, e.clientY, text);
    },
    [enableContextMenu, openMenu]
  );

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (!enableContextMenu) return;
      const t = e.touches[0];
      selectionAnchorRef.current = { x: t.clientX, y: t.clientY };
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        const sel = window.getSelection?.();
        const text = sel?.toString?.()?.trim() ?? "";
        openMenu(t.clientX, t.clientY, text || (document.activeElement?.textContent ?? ""));
      }, 500);
    },
    [enableContextMenu, openMenu]
  );

  const handleTouchEnd = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTranslate = React.useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setTranslateLoading(true);
      setTranslation(null);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), source: "en" }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data.translatedText === "string") {
          setTranslation({
            original: text.trim(),
            translated: data.translatedText,
            targetLang: data.target ?? "?",
          });
          onTranslate?.(text.trim());
        }
      } catch {
        // Fallback: show error or do nothing
        setTranslation({ original: text.trim(), translated: "(Translation failed)", targetLang: "?" });
      } finally {
        setTranslateLoading(false);
      }
    },
    [onTranslate]
  );

  const handleAskAi = React.useCallback(
    (text: string) => {
      onAskAi?.(text);
    },
    [onAskAi]
  );

  const handleCloseMenu = React.useCallback(() => setMenuOpen(false), []);

  return (
    <div
      className={cn(selectable && "select-text", className)}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={enableContextMenu ? { cursor: "context-menu" } : undefined}
    >
      {children}

      {(translation || translateLoading) && (
        <TranslatedBlock
          original={translation?.original ?? ""}
          translated={translation?.translated ?? ""}
          targetLang={translation?.targetLang}
          loading={translateLoading}
        />
      )}

      <AnimatePresence>
        {menuOpen && selectedText && (
          <AiResponseContextMenu
            selectedText={selectedText}
            menuPos={menuPos}
            onClose={handleCloseMenu}
            onTranslate={() => handleTranslate(selectedText)}
            onAskAi={onAskAi ? () => handleAskAi(selectedText) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
