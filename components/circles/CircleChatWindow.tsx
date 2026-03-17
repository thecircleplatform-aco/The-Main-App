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

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    } else if (event.key === "PageDown") {
      event.preventDefault();
      containerRef.current.scrollBy({
        top: containerRef.current.clientHeight,
        behavior: "smooth",
      });
    } else if (event.key === "PageUp") {
      event.preventDefault();
      containerRef.current.scrollBy({
        top: -containerRef.current.clientHeight,
        behavior: "smooth",
      });
    } else if (event.key === "Home") {
      event.preventDefault();
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else if (event.key === "End") {
      event.preventDefault();
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className={cn(
        fullPage
          ? "relative flex flex-col w-full h-full bg-gray-50/95 dark:bg-black circle-chat-bg"
          : "relative flex flex-col h-full min-h-0 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/30 circle-chat-bg",
        className
      )}
    >
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-3 focus:outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Circle chat messages"
        role="region"
      >
        {hasOlder && onLoadOlder && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={loadOlderLoading}
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
            >
              {loadOlderLoading ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-white/50">
            {emptyMessage}
          </div>
        ) : (
          messages.map((msg) => (
            <CircleMessage
              key={msg.id}
              id={msg.id}
              username={msg.username}
              message_text={msg.message_text}
              created_at={msg.created_at}
              isOwn={currentUserId != null && msg.user_id === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} aria-hidden />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4 pt-2">
        <CircleMessageInput
          onSend={onSend}
          disabled={sendLoading}
          className="pointer-events-auto mx-auto w-full max-w-xl"
        />
      </div>
    </div>
  );
}
