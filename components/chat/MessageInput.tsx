"use client";

import * as React from "react";
import { Paperclip, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type MessageInputProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (message: string) => Promise<void> | void;
  onAttach?: (files: File[]) => void;
  acceptMedia?: string;
};

export function MessageInput({
  disabled,
  placeholder = "Type a message…",
  onSend,
  onAttach,
  acceptMedia = "image/*,.pdf,.doc,.docx",
}: MessageInputProps) {
  const [value, setValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onSend(trimmed);
      setValue("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleAttachClick() {
    if (disabled || isSubmitting) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length && onAttach) onAttach(files);
    e.target.value = "";
  }

  const canSend = value.trim().length > 0 && !disabled && !isSubmitting;

  return (
    <div
      className={cn(
        "w-full flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 transition-colors duration-200",
        "focus-within:border-white/20 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
        (disabled || isSubmitting) && "opacity-70"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMedia}
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-label="Attach file"
      />
      <button
        type="button"
        onClick={handleAttachClick}
        disabled={disabled || isSubmitting}
        aria-label="Attach file"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition-all duration-150",
          "hover:bg-white/10 hover:text-white/80",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        <Paperclip className="h-4 w-4" aria-hidden strokeWidth={1.75} />
      </button>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSubmitting}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "min-h-[36px] max-h-24 min-w-0 flex-1 resize-none border-0 bg-transparent py-2 px-3 text-[13px] leading-[1.4] shadow-none outline-none focus:ring-0",
          "placeholder:text-white/35"
        )}
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
          canSend
            ? "bg-white text-zinc-900 hover:bg-white/95 hover:shadow-sm"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        )}
      >
        <Send className="h-4 w-4" aria-hidden strokeWidth={2} />
      </button>
    </div>
  );
}
