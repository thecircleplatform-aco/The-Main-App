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
  placeholder = "Message the council…",
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
        "w-full flex items-center gap-0.5 rounded-2xl border border-white/12 bg-white/[0.06] py-1 pl-1.5 pr-1 shadow-soft backdrop-blur-2xl",
        "focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 focus-within:bg-white/[0.08]"
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
        aria-label="Attach file or image"
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors",
          "hover:bg-white/10 hover:text-white/80 active:scale-95",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <Paperclip className="h-3.5 w-3.5" aria-hidden />
      </button>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSubmitting}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "min-h-[32px] max-h-20 min-w-0 flex-1 resize-none rounded-lg border-0 bg-transparent py-1.5 px-2 text-xs shadow-none focus:ring-0 focus:outline-none",
          "placeholder:text-white/40"
        )}
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          "ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
          canSend
            ? "bg-white text-black hover:bg-white/90 active:scale-95"
            : "bg-white/15 text-white/40 cursor-not-allowed"
        )}
      >
        <Send className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
