import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Trash2, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, avatarPulse, softSpring } from "@/lib/animations";

const MENU_WIDTH = 140;
const MENU_HEIGHT = 170;
const PADDING = 8;

function constrainToViewport(x: number, y: number) {
  const w = typeof window !== "undefined" ? window.innerWidth : 400;
  const h = typeof window !== "undefined" ? window.innerHeight : 600;
  const left = Math.max(PADDING, Math.min(x, w - MENU_WIDTH - PADDING));
  const top = Math.max(PADDING, Math.min(y, h - MENU_HEIGHT - PADDING));
  return { left, top };
}

export type MessageBubbleProps = {
  role: "user" | "agent" | "system";
  content: string;
  agentName?: string;
  createdAt?: string;
  /** User message actions: right-click and long-press menu */
  onCopy?: () => void;
  onDelete?: () => void;
  onEdit?: (editedContent: string) => void;
};

export function MessageBubble({
  role,
  content,
  agentName,
  createdAt,
  onCopy,
  onDelete,
  onEdit,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState({ left: 0, top: 0 });
  const [editing, setEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(content);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const editInputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const hasUserActions = isUser && (onCopy || onDelete || onEdit);

  const openMenu = React.useCallback((clientX: number, clientY: number) => {
    const { left, top } = constrainToViewport(clientX, clientY);
    setMenuPos({ left, top });
    setMenuOpen(true);
  }, []);

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      if (!hasUserActions) return;
      e.preventDefault();
      openMenu(e.clientX, e.clientY);
    },
    [hasUserActions, openMenu]
  );

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (!hasUserActions) return;
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        const t = e.touches[0];
        openMenu(t.clientX, t.clientY);
      }, 500);
    },
    [hasUserActions, openMenu]
  );

  const handleTouchEnd = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleCopy = React.useCallback(() => {
    onCopy?.();
    setMenuOpen(false);
  }, [onCopy]);

  const handleDelete = React.useCallback(() => {
    onDelete?.();
    setMenuOpen(false);
  }, [onDelete]);

  const handleEdit = React.useCallback(() => {
    setMenuOpen(false);
    setEditValue(content);
    setEditing(true);
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, [content]);

  const handleEditSave = React.useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== content) {
      onEdit?.(trimmed);
    }
    setEditing(false);
  }, [editValue, content, onEdit]);

  const handleEditKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleEditSave();
      }
      if (e.key === "Escape") setEditing(false);
    },
    [handleEditSave]
  );

  React.useEffect(() => {
    if (!menuOpen) return;
    function closeOnClickOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function closeOnEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", closeOnClickOutside);
    document.addEventListener("touchstart", closeOnClickOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnClickOutside);
      document.removeEventListener("touchstart", closeOnClickOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <motion.div
      layout
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ ...softSpring, mass: 0.6 }}
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <motion.div
          className="mt-1 h-8 w-8 shrink-0 rounded-2xl bg-white/10 text-xs font-semibold text-white/90 shadow-soft backdrop-blur-xl flex items-center justify-center"
          variants={avatarPulse}
          initial="rest"
          animate="pulse"
        >
          {(agentName ?? "AI")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)}
        </motion.div>
      )}

      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-soft backdrop-blur-2xl",
            isUser
              ? "ml-auto bg-white text-black"
              : "glass bg-white/7 text-white/90 border border-white/12",
            hasUserActions && "cursor-context-menu"
          )}
          onContextMenu={editing ? undefined : handleContextMenu}
          onTouchStart={editing ? undefined : handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editInputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={3}
                className={cn(
                  "min-w-[200px] resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2",
                  isUser
                    ? "border-black/15 bg-black/5 text-black focus:ring-black/20"
                    : "border-white/20 bg-white/10 text-white focus:ring-white/20"
                )}
              />
              <button
                type="button"
                onClick={handleEditSave}
                className={cn(
                  "flex items-center justify-center gap-2 self-end rounded-lg px-3 py-1.5 text-xs font-medium",
                  isUser
                    ? "bg-black/15 text-black hover:bg-black/25"
                    : "bg-white/20 text-white hover:bg-white/30"
                )}
              >
                <Check className="h-3.5 w-3.5" />
                Save &amp; Regenerate
              </button>
            </div>
          ) : (
          content.split("\n").map((line, idx) => (
            <p
              key={idx}
              className={cn(
                "whitespace-pre-wrap",
                idx > 0 ? "mt-1" : undefined
              )}
            >
              {line}
            </p>
          ))
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 text-[11px] text-white/40",
            isUser ? "justify-end pr-2" : "justify-start pl-1"
          )}
        >
          {agentName && !isUser ? <span>{agentName}</span> : null}
          {createdAt ? (
            <span>
              {new Date(createdAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && hasUserActions && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-black/95 py-1 shadow-xl backdrop-blur-2xl"
            style={{ left: menuPos.left, top: menuPos.top }}
          >
            {onEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                <Pencil className="h-4 w-4 text-white/60" />
                Edit
              </button>
            )}
            {onCopy && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                <Copy className="h-4 w-4 text-white/60" />
                Copy
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                <Trash2 className="h-4 w-4 text-white/60" />
                Delete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

