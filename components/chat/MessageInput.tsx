"use client";

import * as React from "react";
import { Paperclip, Send, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { takePhoto, pickFromGallery } from "@/lib/camera";
import { hapticImpact } from "@/lib/capacitor";
import { isNative } from "@/lib/capacitor";

export type MessageInputProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (message: string) => Promise<void> | void;
  onAttach?: (files: File[]) => void;
  acceptMedia?: string;
};

function base64ToFile(base64: string, format: string): File {
  const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([new Blob([arr], { type: mime })], `photo.${format}`, { type: mime });
}

export function MessageInput({
  disabled,
  placeholder = "Type a message…",
  onSend,
  onAttach,
  acceptMedia = "image/*,.pdf,.doc,.docx",
}: MessageInputProps) {
  const [value, setValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { isSupported: voiceSupported, state: voiceState, transcript, start: startVoice, stop: stopVoice, reset: resetVoice } = useSpeechRecognition();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (transcript) setValue((v) => (v ? `${v} ${transcript}` : transcript).trim());
  }, [transcript]);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSubmitting) return;
    try {
      hapticImpact();
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
    if (isNative() && onAttach) {
      setShowAttachMenu((v) => !v);
    } else {
      fileInputRef.current?.click();
    }
  }

  async function handleTakePhoto() {
    setShowAttachMenu(false);
    const photo = await takePhoto();
    if (photo && onAttach) {
      onAttach([base64ToFile(photo.base64, photo.format)]);
      hapticImpact();
    }
  }

  async function handlePickGallery() {
    setShowAttachMenu(false);
    const photo = await pickFromGallery();
    if (photo && onAttach) {
      onAttach([base64ToFile(photo.base64, photo.format)]);
      hapticImpact();
    }
  }

  function handleFileInputClick() {
    setShowAttachMenu(false);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length && onAttach) {
      onAttach(files);
      hapticImpact();
    }
    e.target.value = "";
  }

  function handleVoiceToggle() {
    if (voiceState === "listening") stopVoice();
    else startVoice();
    hapticImpact();
  }


  const canSend = value.trim().length > 0 && !disabled && !isSubmitting;
  const isListening = voiceState === "listening";

  return (
    <div className="relative">
      {/* Single chat input bubble: one rounded bar with everything inside */}
      <div
        className={cn(
          "message-input-bar flex w-full items-end gap-1.5 rounded-3xl px-2 py-2 transition-all duration-200 backdrop-blur-2xl sm:items-center sm:gap-2 sm:px-3 sm:py-2.5",
          "bg-white/90 focus-within:bg-white/95",
          "dark:bg-white/[0.08] dark:focus-within:bg-white/[0.12]",
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

        {onAttach && (
          <button
            type="button"
            onClick={handleAttachClick}
            disabled={disabled || isSubmitting}
            aria-label="Attach file"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6c4dff]/70 transition-all duration-150 hover:bg-[#6c4dff]/10 hover:text-[#6c4dff] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/80 sm:h-8 sm:w-8",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <Paperclip className="h-4 w-4" aria-hidden strokeWidth={1.75} />
          </button>
        )}

        {mounted && voiceSupported && (
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={disabled || isSubmitting}
            aria-label={isListening ? "Stop listening" : "Voice input"}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150 sm:h-8 sm:w-8",
              isListening ? "bg-rose-500/30 text-rose-600 dark:text-rose-300" : "text-[#6c4dff]/70 hover:bg-[#6c4dff]/10 hover:text-[#6c4dff] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/80",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSubmitting}
          placeholder={isListening ? "Listening…" : placeholder}
          rows={1}
          className={cn(
            "min-h-[40px] max-h-24 min-w-0 flex-1 resize-none border-0 bg-transparent py-2.5 px-3 text-[13px] leading-[1.4] text-[#1e1b4b] shadow-none outline-none focus:ring-0 placeholder:text-[#6c4dff]/50 dark:text-white dark:placeholder:text-white/35 sm:min-h-[36px] sm:py-2"
          )}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150 sm:h-8 sm:w-8",
            canSend
              ? "bg-gradient-to-r from-[#6c4dff] via-[#3fa9ff] to-[#34d399] text-white shadow-[0_4px_12px_-2px_rgba(108,77,255,0.4),0_2px_8px_-2px_rgba(52,211,153,0.2)] hover:shadow-[0_6px_20px_-4px_rgba(108,77,255,0.5),0_4px_12px_-2px_rgba(52,211,153,0.3)] dark:[background-image:none] dark:bg-white dark:text-zinc-900 dark:hover:bg-white/95 dark:shadow-none"
              : "bg-[#6c4dff]/10 text-[#6c4dff]/40 cursor-not-allowed dark:bg-white/10 dark:text-white/30"
          )}
        >
          <Send className="h-4 w-4" aria-hidden strokeWidth={2} />
        </button>
      </div>

      {showAttachMenu && onAttach && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/95">
          <button
            type="button"
            onClick={handleTakePhoto}
            className="rounded-lg px-3 py-2 text-xs text-gray-800 transition-colors hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/10"
          >
            Camera
          </button>
          <button
            type="button"
            onClick={handlePickGallery}
            className="rounded-lg px-3 py-2 text-xs text-gray-800 transition-colors hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/10"
          >
            Gallery
          </button>
          <button
            type="button"
            onClick={handleFileInputClick}
            className="rounded-lg px-3 py-2 text-xs text-gray-800 transition-colors hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/10"
          >
            Files
          </button>
        </div>
      )}
    </div>
  );
}
