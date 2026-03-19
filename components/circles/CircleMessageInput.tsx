"use client";

import * as React from "react";
import { Image as ImageIcon, Mic, Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 500;
const VOICE_PREFIX = "__voice__:";
const STICKER_PREFIX = "__sticker__:";

const STICKERS: { id: string; emoji: string; label: string }[] = [
  { id: "sparkles", emoji: "✨", label: "Sparkles" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "heart", emoji: "❤️", label: "Heart" },
  { id: "laugh", emoji: "😂", label: "Laugh" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "cool", emoji: "😎", label: "Cool" },
  { id: "clap", emoji: "👏", label: "Clap" },
  { id: "party", emoji: "🥳", label: "Party" },
  { id: "100", emoji: "💯", label: "100" },
  { id: "star", emoji: "⭐", label: "Star" },
  { id: "idea", emoji: "💡", label: "Idea" },
  { id: "rocket", emoji: "🚀", label: "Rocket" },
];

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
  const [isUploadingVoice, setIsUploadingVoice] = React.useState(false);
  const [voiceError, setVoiceError] = React.useState<string | null>(null);
  const [stickerOpen, setStickerOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const voiceChunksRef = React.useRef<BlobPart[]>([]);

  const trimmed = value.trim();
  const canSend =
    trimmed.length >= 1 &&
    trimmed.length <= MAX_LENGTH &&
    !disabled &&
    !isUploadingVoice &&
    !isRecording;

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

  const cleanupRecorder = () => {
    try {
      const rec = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      voiceChunksRef.current = [];
      if (rec && rec.state !== "inactive") rec.stop();
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    return () => cleanupRecorder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    if (disabled || isUploadingVoice || isRecording) return;
    setVoiceError(null);
    setStickerOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      voiceChunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) voiceChunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        try {
          const tracks = stream.getTracks();
          for (const t of tracks) t.stop();
        } catch {
          // ignore
        }

        const parts = voiceChunksRef.current;
        voiceChunksRef.current = [];
        if (!parts.length) return;

        const blob = new Blob(parts, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 800) return; // ignore accidental taps

        setIsUploadingVoice(true);
        try {
          const fd = new FormData();
          fd.append("audio", new File([blob], "voice.webm", { type: blob.type }));
          const res = await fetch("/api/circle-messages/upload-audio", {
            method: "POST",
            body: fd,
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.url) {
            throw new Error(data?.error || "Upload failed");
          }
          onSend(`${VOICE_PREFIX}${data.url}`);
        } catch (e) {
          setVoiceError(e instanceof Error ? e.message : "Failed to send voice note");
        } finally {
          setIsUploadingVoice(false);
        }
      };

      rec.start();
      setIsRecording(true);
    } catch (e) {
      setVoiceError(
        e instanceof Error ? e.message : "Microphone permission denied"
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    try {
      if (rec.state !== "inactive") rec.stop();
    } catch {
      // ignore
    }
  };

  const handleMicMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void startRecording();
  };

  const handleMicMouseUp = () => {
    stopRecording();
  };

  const handleMicMouseLeave = () => {
    stopRecording();
  };

  const handleMicTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void startRecording();
  };

  const handleMicTouchEnd = () => {
    stopRecording();
  };

  const handleMicTouchCancel = () => {
    stopRecording();
  };

  const handleAttachClick = () => {
    if (disabled) return;
    setStickerOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAttachImages?.(files);
    }
    e.target.value = "";
  };

  const handleStickerPick = (id: string) => {
    if (disabled || isUploadingVoice || isRecording) return;
    setStickerOpen(false);
    onSend(`${STICKER_PREFIX}${id}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "message-input-bar relative flex items-center gap-2 px-2 sm:px-3 h-14 sm:h-[60px]",
        "rounded-[30px] border",
        "bg-white/90 backdrop-blur-2xl shadow-[0_18px_45px_rgba(7,12,22,0.14)]",
        "border-slate-200/80 focus-within:border-violet-200/80",
        "dark:bg-white/[0.08] dark:border-white/10 dark:shadow-[0_18px_45px_rgba(0,0,0,0.55)] dark:focus-within:border-white/18",
        className
      )}
    >
      {voiceError && (
        <div className="absolute -top-9 left-0 right-0 mx-auto w-fit max-w-[92%] rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-700 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          {voiceError}
        </div>
      )}

      <button
        type="button"
        onClick={handleAttachClick}
        disabled={disabled || isUploadingVoice || isRecording}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95",
          "text-violet-700/70 hover:bg-violet-500/10 hover:text-violet-700",
          "dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white/85",
          (disabled || isUploadingVoice || isRecording) && "opacity-50 pointer-events-none"
        )}
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
      <div className="relative">
        <button
          type="button"
          onClick={() => setStickerOpen((v) => !v)}
          disabled={disabled || isUploadingVoice || isRecording}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95",
            "text-violet-700/70 hover:bg-violet-500/10 hover:text-violet-700",
            "dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white/85",
            (disabled || isUploadingVoice || isRecording) && "opacity-50 pointer-events-none"
          )}
          aria-label="Stickers"
        >
          <Smile className="h-4 w-4" />
        </button>

        {stickerOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-[260px] rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/90">
            <div className="grid grid-cols-6 gap-1">
              {STICKERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStickerPick(s.id)}
                  className="grid h-10 w-10 place-items-center rounded-xl text-[20px] transition hover:bg-slate-100 active:scale-95 dark:hover:bg-white/10"
                  aria-label={s.label}
                  title={s.label}
                >
                  {s.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
            "bg-transparent text-slate-900 placeholder:text-slate-500/60",
            "dark:text-white dark:placeholder:text-white/35",
            "border border-transparent focus:outline-none focus:ring-0"
          )}
          aria-label="Message"
        />
      </div>
      <button
        type="button"
        aria-label={
          isUploadingVoice
            ? "Uploading voice note"
            : isRecording
              ? "Recording voice note"
              : "Hold to record voice note"
        }
        onMouseDown={handleMicMouseDown}
        onMouseUp={handleMicMouseUp}
        onMouseLeave={handleMicMouseLeave}
        onTouchStart={handleMicTouchStart}
        onTouchEnd={handleMicTouchEnd}
        onTouchCancel={handleMicTouchCancel}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95",
          "text-violet-700/70 hover:bg-violet-500/10 hover:text-violet-700",
          "dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white/85",
          isUploadingVoice && "opacity-60 pointer-events-none",
          isRecording && "bg-rose-500/15 text-rose-600 dark:text-rose-300 animate-pulse"
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
          "bg-gradient-to-r from-violet-600 via-sky-500 to-emerald-400 shadow-[0_6px_20px_rgba(100,150,255,0.22)]",
          "dark:[background-image:none] dark:bg-white dark:text-zinc-900 dark:hover:bg-white/95 dark:shadow-none",
          !canSend && "pointer-events-none"
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
