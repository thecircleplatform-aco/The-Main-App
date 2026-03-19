"use client";

import * as React from "react";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommentItem = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  replies?: CommentItem[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  comments: CommentItem[];
  commentDraft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (opts?: { replyToId?: string }) => void;
  submitting?: boolean;
  className?: string;
};

export function CommentsSheet({
  open,
  onClose,
  title,
  comments,
  commentDraft,
  onDraftChange,
  onSubmit,
  submitting,
  className,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = React.useState<null | { id: string; author: string }>(null);

  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) setReplyTo(null);
  }, [open]);

  React.useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, comments.length]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center",
        "text-slate-900 dark:text-white",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Comments"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Close comments"
      />

      <div
        className={cn(
          "relative z-[71] w-full max-w-2xl",
          "max-h-[85dvh]",
          "rounded-t-3xl border border-slate-200 bg-[#f5f7fb] shadow-2xl",
          "dark:border-white/10 dark:bg-[#0b0f19]",
          "animate-in slide-in-from-bottom duration-200"
        )}
        style={{
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/15" />

        <div
          className={cn(
            "flex shrink-0 items-center justify-between border-b px-4 py-3",
            "border-slate-200 bg-white/70 backdrop-blur",
            "dark:border-white/10 dark:bg-white/5"
          )}
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full",
              "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              "dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex max-h-[calc(85dvh-118px)] flex-col">
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-3"
          >
            {comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No comments yet. Be the first to reply.
              </p>
            ) : (
              <ul className="space-y-4">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-slate-200">
                      {c.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {c.author}
                        </span>
                        <span className="text-xs text-slate-500">{c.createdAt}</span>
                      </div>
                      <p className="mt-0.5 text-sm leading-snug text-slate-700 dark:text-slate-200">
                        {c.text}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <button
                          type="button"
                          className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
                          onClick={() => {
                            setReplyTo({ id: c.id, author: c.author });
                            inputRef.current?.focus();
                          }}
                        >
                          Reply
                        </button>
                      </div>

                      {(c.replies?.length ?? 0) > 0 && (
                        <ul className="mt-3 space-y-3 border-l border-slate-200 pl-3 dark:border-white/10">
                          {c.replies!.map((r) => (
                            <li key={r.id} className="flex gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                {r.author.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                    {r.author}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {r.createdAt}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-sm leading-snug text-slate-700 dark:text-slate-200">
                                  {r.text}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            className={cn(
              "shrink-0 border-t p-3",
              "border-slate-200 bg-white/80 backdrop-blur",
              "dark:border-white/10 dark:bg-white/5"
            )}
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(replyTo ? { replyToId: replyTo.id } : undefined);
            }}
          >
            {replyTo && (
              <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-white/10 dark:text-slate-200">
                <span className="truncate">
                  Replying to <span className="font-semibold">{replyTo.author}</span>
                </span>
                <button
                  type="button"
                  className="font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => setReplyTo(null)}
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                className={cn(
                  "flex-1 rounded-full border px-4 py-2.5 text-sm",
                  "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",
                  "focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500",
                  "dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/45"
                )}
                placeholder={replyTo ? `Reply to ${replyTo.author}…` : "Add a comment…"}
                value={commentDraft}
                onChange={(e) => onDraftChange(e.target.value)}
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!commentDraft.trim() || submitting}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
