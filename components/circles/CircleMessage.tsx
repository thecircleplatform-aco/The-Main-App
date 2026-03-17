"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type CircleMessageProps = {
  id: string;
  username: string;
  message_text: string;
  created_at: string;
  isOwn?: boolean;
  onAction?: (action: CircleMessageAction, messageId: string) => void;
};

export type CircleMessageAction =
  | "reply"
  | "copy_text"
  | "edit"
  | "delete"
  | "report";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export function CircleMessage({
  id,
  username,
  message_text,
  created_at,
  isOwn,
  onAction,
}: CircleMessageProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Close any other open message menus first
    window.dispatchEvent(new CustomEvent("circle-message-close-menus"));
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setMenuOpen(true);
  };

  React.useEffect(() => {
    const handleGlobalClose = () => setMenuOpen(false);
    window.addEventListener("circle-message-close-menus", handleGlobalClose as EventListener);

    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener(
        "circle-message-close-menus",
        handleGlobalClose as EventListener
      );
      window.removeEventListener("click", close);
      window.removeEventListener("resize", close);
    };
  }, [menuOpen]);

  const handleActionClick = async (action: CircleMessageAction) => {
    if (action === "copy_text") {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(message_text);
        }
      } catch {
        // ignore
      }
    }
    onAction?.(action, id);
    setMenuOpen(false);
  };

  const actions: { id: CircleMessageAction; label: string }[] = [
    { id: "reply", label: "Reply" },
    { id: "copy_text", label: "Copy text" },
    { id: "edit", label: "Edit message" },
    { id: "delete", label: "Delete message" },
    { id: "report", label: "Report message" },
  ];

  return (
    <div
      className={cn("flex w-full mb-1.5", isOwn ? "justify-end" : "justify-start")}
      onContextMenu={handleContextMenu}
    >
      <div
        className={cn(
          "group relative max-w-[80%] flex flex-col gap-0.5 rounded-[18px] px-3 py-2 chat-bubble-in",
          isOwn
            ? menuOpen
              ? "rounded-br-[6px] bg-[linear-gradient(135deg,#4f8cff,#6aa8ff)] text-white shadow-[0_6px_20px_rgba(100,150,255,0.35)]"
              : "rounded-br-[6px] bg-[linear-gradient(135deg,#4f8cff,#6aa8ff)] text-white shadow-[0_6px_20px_rgba(100,150,255,0.25)]"
            : menuOpen
              ? "rounded-bl-[6px] border border-[rgba(120,170,255,0.22)] bg-[rgba(40,50,80,0.9)] text-slate-50 shadow-sm"
              : "rounded-bl-[6px] border border-[rgba(120,170,255,0.16)] bg-[rgba(40,50,80,0.6)] text-slate-50 shadow-sm"
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href={`/users/${encodeURIComponent(username)}`}
            className={cn(
              "text-xs font-semibold truncate hover:underline",
              isOwn ? "text-white/90" : "text-slate-200"
            )}
          >
            {username}
          </Link>
          <span
            className={cn(
              "text-[10px] shrink-0",
              isOwn ? "text-white/80" : "text-slate-300/80"
            )}
          >
            {formatTime(created_at)}
          </span>
        </div>
        <p
          className={cn(
            "text-sm whitespace-pre-wrap break-words",
            isOwn ? "text-white" : "text-slate-50"
          )}
        >
          {message_text}
        </p>

        {menuOpen && menuPos && (
          <div
            className={cn(
              "absolute z-30 min-w-[180px] max-w-xs rounded-lg border border-gray-200/80 bg-white/95 text-gray-900 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-black/90 dark:text-white",
              isOwn ? "right-0" : "left-0"
            )}
            style={{
              top: Math.min(menuPos.y, 200),
            }}
          >
            <ul className="max-h-80 overflow-y-auto py-1 text-xs">
              {actions.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    onClick={() => handleActionClick(action.id)}
                    className="block w-full px-3 py-1.5 text-left hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/20 dark:hover:text-violet-100"
                  >
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
