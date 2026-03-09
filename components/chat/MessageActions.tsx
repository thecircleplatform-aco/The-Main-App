"use client";

import * as React from "react";
import { Copy, ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageMenu } from "./MessageMenu";
import { shareContent } from "@/lib/share";
import { hapticImpact } from "@/lib/capacitor";

export type MessageActionsProps = {
  messageId: string;
  messageText: string;
  onCopy?: () => void;
  onFeedback?: (type: "helpful" | "not_helpful") => void;
  onShare?: (action: "copy_link") => void;
  onSave?: () => void;
  onReport?: () => void;
  onHide?: () => void;
  /** Feedback state: null = none, "helpful" | "not_helpful" = already submitted */
  feedbackState?: "helpful" | "not_helpful" | null;
  /** Force visibility; when false, uses hover (desktop) / always (mobile) */
  visible?: boolean;
  className?: string;
};

/**
 * Action row for AI messages: Copy, Feedback, Share, More menu.
 * Visible on hover (desktop) or tap (mobile).
 */
export function MessageActions({
  messageId,
  messageText,
  onCopy,
  onFeedback,
  onShare,
  onSave,
  onReport,
  onHide,
  feedbackState = null,
  visible,
  className,
}: MessageActionsProps) {
  const [showFeedbackMenu, setShowFeedbackMenu] = React.useState(false);
  const [copySuccess, setCopySuccess] = React.useState(false);

  const handleCopy = React.useCallback(() => {
    hapticImpact();
    if (typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(messageText).then(
        () => {
          setCopySuccess(true);
          onCopy?.();
          setTimeout(() => setCopySuccess(false), 1500);
        },
        () => {
          // Fallback for older browsers
          const ta = document.createElement("textarea");
          ta.value = messageText;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 1500);
        }
      );
    }
  }, [messageText, onCopy]);

  const handleShare = React.useCallback(async () => {
    hapticImpact();
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/?share=${encodeURIComponent(messageId)}`
      : "";
    const shared = await shareContent({
      title: "Circle Insight",
      text: messageText.slice(0, 200) + (messageText.length > 200 ? "…" : ""),
      url: url || undefined,
      dialogTitle: "Share",
    });
    if (!shared && typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(url || messageText).then(() => onShare?.("copy_link"));
    } else if (shared) {
      onShare?.("copy_link");
    }
  }, [messageId, messageText, onShare]);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 transition-opacity duration-150",
        visible === true
          ? "opacity-100"
          : visible === false
            ? "opacity-0 group-hover:opacity-100"
            : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
        className
      )}
    >
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy message"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-colors",
          "text-white/60 hover:bg-white/10 hover:text-white/90"
        )}
      >
        <Copy className="h-3.5 w-3.5" />
        {copySuccess ? "Copied" : "Copy"}
      </button>

      {feedbackState === null ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFeedbackMenu((v) => !v)}
            aria-label="Feedback"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-colors",
              "text-white/60 hover:bg-white/10 hover:text-white/90"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            Feedback
          </button>
          <AnimatePresence>
            {showFeedbackMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 bottom-full z-10 mb-1 flex gap-0.5 rounded-lg border border-white/10 bg-black/90 p-0.5 backdrop-blur-2xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    onFeedback?.("helpful");
                    setShowFeedbackMenu(false);
                  }}
                  aria-label="Helpful"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/80 transition-colors hover:bg-white/10"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Helpful
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onFeedback?.("not_helpful");
                    setShowFeedbackMenu(false);
                  }}
                  aria-label="Not helpful"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/80 transition-colors hover:bg-white/10"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Not helpful
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <span className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-white/40">
          {feedbackState === "helpful" ? (
            <><ThumbsUp className="h-3.5 w-3.5" /> Thanks!</>
          ) : (
            <><ThumbsDown className="h-3.5 w-3.5" /> Noted</>
          )}
        </span>
      )}

      <button
        type="button"
        onClick={handleShare}
        aria-label="Share"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-colors",
          "text-white/60 hover:bg-white/10 hover:text-white/90"
        )}
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      <MessageMenu onSave={onSave} onReport={onReport} onHide={onHide} />
    </div>
  );
}
