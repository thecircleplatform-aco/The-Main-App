"use client";

import * as React from "react";
import { Image as ImageIcon, Mic, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 500;

export type CircleMessageInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onAttachImages?: (files: FileList) => void;
};

export function CircleMessageInput({
  onSend,
  disabled,
  placeholder = "Type a message...",
  className,
  onAttachImages,
}: CircleMessageInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const trimmed = value.trim();
  const canSend = trimmed.length >= 1 && trimmed.length <= MAX_LENGTH && !disabled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend(trimmed);
        setValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "44px";
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, MAX_LENGTH);
    setValue(next);
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  const startRecording = () => {
    if (disabled) return;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
  };

  const handleMicMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startRecording();
  };

  const handleMicMouseUp = () => {
    stopRecording();
  };

  const handleMicMouseLeave = () => {
    stopRecording();
  };

  const handleMicTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startRecording();
  };

  const handleMicTouchEnd = () => {
    stopRecording();
  };

  const handleMicTouchCancel = () => {
    stopRecording();
  };

  const handleAttachClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAttachImages?.(files);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "message-input-bar flex items-center gap-2 px-2 sm:px-3 h-14 sm:h-[60px]",
        "rounded-[30px] border border-[rgba(120,170,255,0.15)]",
        "bg-[rgba(20,30,55,0.7)] backdrop-blur-xl shadow-[0_18px_45px_rgba(7,12,22,0.9)]",
        className
      )}
    >
      <button
        type="button"
        onClick={handleAttachClick}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(120,170,255,0.22)] bg-[rgba(18,27,48,0.9)] text-slate-200/80 shadow-sm hover:bg-[rgba(24,35,60,0.95)] transition active:scale-95"
        aria-label="Attach image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex-1 flex items-center">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "w-full resize-none rounded-2xl px-3 py-2 text-sm",
            "bg-transparent text-slate-50 placeholder:text-slate-400/70",
            "border border-transparent focus:outline-none focus:ring-0"
          )}
          aria-label="Message"
        />
      </div>
      <button
        type="button"
        aria-label={isRecording ? "Recording voice message" : "Hold to record voice message"}
        onMouseDown={handleMicMouseDown}
        onMouseUp={handleMicMouseUp}
        onMouseLeave={handleMicMouseLeave}
        onTouchStart={handleMicTouchStart}
        onTouchEnd={handleMicTouchEnd}
        onTouchCancel={handleMicTouchCancel}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95",
          "border-[rgba(120,170,255,0.22)] bg-[rgba(18,27,48,0.9)] text-slate-200/80",
          isRecording && "border-red-400 text-red-500 bg-red-500/10 animate-pulse"
        )}
      >
        <Mic className="h-4 w-4" />
      </button>
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-default",
          "bg-[linear-gradient(135deg,#4f8cff,#6aa8ff)] shadow-[0_6px_20px_rgba(100,150,255,0.25)]",
          !canSend && "pointer-events-none"
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
