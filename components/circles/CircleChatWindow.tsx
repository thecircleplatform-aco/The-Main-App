"use client";

import * as React from "react";
import { CircleMessage } from "./CircleMessage";
import { CircleMessageInput } from "./CircleMessageInput";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  username: string;
  message_text: string;
  created_at: string;
  user_id?: string;
};

export type CircleChatWindowProps = {
  messages: ChatMessage[];
  currentUserId?: string | null;
  onSend: (message: string) => void;
  sendLoading?: boolean;
  onLoadOlder?: () => void;
  hasOlder?: boolean;
  loadOlderLoading?: boolean;
  className?: string;
  emptyMessage?: string;
  fullPage?: boolean;
};

export function CircleChatWindow({
  messages,
  currentUserId,
  onSend,
  sendLoading,
  onLoadOlder,
  hasOlder,
  loadOlderLoading,
  className,
  emptyMessage = "No messages yet. Say hello!",
  fullPage,
}: CircleChatWindowProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const lineScroll = 40;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      containerRef.current.scrollBy({ top: lineScroll, behavior: "smooth" });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      containerRef.current.scrollBy({ top: -lineScroll, behavior: "smooth" });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col w-full h-full bg-transparent",
        !fullPage && "rounded-3xl border border-white/5 shadow-2xl overflow-hidden",
        className
      )}
    >
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 focus:outline-none no-scrollbar"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {hasOlder && onLoadOlder && (
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={loadOlderLoading}
              className="px-4 py-1.5 rounded-full bg-white/5 text-[11px] font-bold text-violet-300 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {loadOlderLoading ? "Loading history..." : "Load older messages"}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
             <p className="text-[13px] text-white/30 font-medium max-w-[200px] leading-relaxed">
               {emptyMessage}
             </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {messages.map((msg, idx) => (
              <CircleMessage
                key={msg.id}
                id={msg.id}
                username={msg.username}
                message_text={msg.message_text}
                created_at={msg.created_at}
                isOwn={currentUserId != null && msg.user_id === currentUserId}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} aria-hidden className="h-4 shrink-0" />
      </div>

      <div className="px-4 pb-6 pt-2">
        <CircleMessageInput
          onSend={onSend}
          disabled={sendLoading}
          className="shrink-0 bg-white/5 border-white/10 hover:border-white/20 focus-within:border-violet-400/40 transition-all rounded-2xl"
        />
      </div>
    </div>
  );
}
