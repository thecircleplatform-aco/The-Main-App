"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { X, Menu, User, LogIn, UserPlus, CircleDot } from "lucide-react";
import { AccountRecoveryView } from "@/components/account/AccountRecoveryView";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { MessageActions } from "./MessageActions";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";
import { clearSessionAndRedirectToLogin } from "@/lib/logout";

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
  agentName?: string;
  createdAt: string;
};

const STORAGE_KEY_PREFIX = "circle.chat.history.v1";

type Status = "idle" | "sending" | "thinking";

function getStorageKey(userId: string | null): string | null {
  if (!userId) return null;
  return `${STORAGE_KEY_PREFIX}.${userId}`;
}

function loadInitialMessages(userId: string | null): ChatMessage[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const key = getStorageKey(userId);
    if (!key) return [];
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m: ChatMessage) => m.id && m.role && m.content);
  } catch {
    return [];
  }
}

function persistMessages(messages: ChatMessage[], userId: string | null) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const key = getStorageKey(userId);
    if (key) window.localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

export function ChatWindow() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [showSideMenu, setShowSideMenu] = React.useState(false);
  /** Per-message feedback: messageId -> "helpful" | "not_helpful" */
  const [feedbackByMessage, setFeedbackByMessage] = React.useState<Record<string, "helpful" | "not_helpful">>({});
  const [me, setMe] = React.useState<{
    id: string | null;
    email: string | null;
    name?: string;
    deletionScheduledAt?: string | null;
  } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const isSendingRef = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (me?.id) {
      setMessages(loadInitialMessages(me.id));
    }
  }, [me?.id]);

  // Must be signed in to use chat; redirect to login if not (clear cookie first to avoid redirect loop), or /help if blocked
  React.useEffect(() => {
    fetch("/api/me")
      .then(async (r) => {
        if (r.status === 403) {
          const data = await r.json().catch(() => ({}));
          if (data?.blocked) {
            window.location.replace("/help");
            return null;
          }
        }
        if (r.status === 401) {
          const from = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
          void clearSessionAndRedirectToLogin(from);
          return null;
        }
        return r.ok ? r.json() : { id: null, email: null, name: null, deletionScheduledAt: null };
      })
      .then((data) => {
        if (!data) return;
        setMe({ ...data, id: data.id ?? null });
        if (data.email == null) {
          const from = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
          void clearSessionAndRedirectToLogin(from);
        }
      })
      .catch(() => {
        setMe({ id: null, email: null, deletionScheduledAt: null });
        void clearSessionAndRedirectToLogin();
      });
  }, []);

  React.useEffect(() => {
    if (messages.length && me?.id) {
      persistMessages(messages, me.id);
    }
  }, [messages, me?.id]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);


  React.useEffect(() => {
    if (!showSideMenu) return;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : { email: null, name: null, deletionScheduledAt: null }))
      .then((data) => setMe(data))
      .catch(() => { /* keep previous me on refetch failure */ });
  }, [showSideMenu]);

  function handleSend(userText: string, overrideHistory?: ChatMessage[]) {
    if (isSendingRef.current) return;
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };
    const history = overrideHistory ?? messages;
    setMessages([...history, userMessage]);
    setError("AI chat is not available.");
  }

  function handleFeedback(messageId: string, type: "helpful" | "not_helpful") {
    setFeedbackByMessage((prev) => ({ ...prev, [messageId]: type }));
    fetch("/api/message-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, feedbackType: type }),
    }).catch(() => {});
  }

  function handleHideMessage(messageId: string) {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }

  function handleDeleteLatestUserMessage(messageId: string) {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const next = messages[idx + 1];
    const idsToRemove = new Set([messageId]);
    if (next?.role === "agent") idsToRemove.add(next.id);
    setMessages((prev) => prev.filter((m) => !idsToRemove.has(m.id)));
  }

  function handleCopyUserMessage(content: string) {
    if (typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(content);
    }
  }

  function handleEditUserMessage(messageId: string, editedContent: string) {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const historyBeforeEdit = messages.slice(0, idx);
    void handleSend(editedContent, historyBeforeEdit);
  }

  const isBusy = status === "sending";
  const showRecoveryForm = Boolean(me?.email && me?.deletionScheduledAt);
  const visibleMessages = messages;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-transparent">
      {/* Fixed header */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-black/90 sm:px-5 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSideMenu(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100/80 text-gray-600 transition-colors hover:bg-gray-200/80 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-white/15 dark:focus:ring-offset-black/90"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <h2 className="truncate text-xs font-semibold text-gray-900 dark:text-white/90 sm:text-sm">
            Chat
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-gray-500 sm:text-xs dark:text-white/50">
          <span className="text-gray-600 dark:text-white/60">Ready</span>
        </div>
      </header>

      {/* Side menu drawer */}
      <AnimatePresence>
        {showSideMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm dark:bg-black/60"
              aria-hidden
              onClick={() => setShowSideMenu(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 z-30 flex h-full w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white/98 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/95"
            >
              <div className="flex shrink-0 flex-col gap-0.5 border-b border-white/10 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Image src="/logo.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">Circle</span>
                  </div>
                    <button
                    type="button"
                    onClick={() => setShowSideMenu(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-white/50">powered by ACO Network</p>
              </div>
              <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3">
                <Link
                  href="/circles"
                  onClick={() => setShowSideMenu(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-800 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <CircleDot className="h-4 w-4 text-white/60" />
                  Circles
                </Link>
                {!(mounted && me?.email) && (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setShowSideMenu(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-800 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <LogIn className="h-4 w-4 text-white/60" />
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowSideMenu(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-800 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <UserPlus className="h-4 w-4 text-white/60" />
                      Register
                    </Link>
                  </>
                )}
              </nav>
              <div className="flex shrink-0 flex-col gap-0.5 border-t border-white/10 px-4 py-3">
                {mounted && me?.email ? (
                  <Link
                    href="/profile"
                    onClick={() => setShowSideMenu(false)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-gray-200 -mx-2 dark:hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-white/10">
                      <User className="h-5 w-5 text-gray-700 dark:text-white/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {me.name && (
                        <p className="truncate text-xs font-medium text-gray-900 dark:text-white/90">
                          {me.name}
                        </p>
                      )}
                      <p className="truncate text-[11px] text-gray-600 dark:text-white/60">
                        {me.email}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-500 dark:text-white/40">Tap for Profile</p>
                    </div>
                  </Link>
                ) : null}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Account recovery form when deletion is scheduled */}
      {showRecoveryForm ? (
        <AccountRecoveryView onRecovered={() => setMe((m) => m ? { ...m, deletionScheduledAt: null } : m)} />
      ) : (
        <>
      {/* Full-screen scrollable content - pb clears floating input */}
      <main
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pb-24 py-3 sm:px-5 sm:pb-28 sm:py-4"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <AnimatePresence initial={false}>
          {visibleMessages.length === 0 && (
            <motion.div
              key="empty"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center"
            >
              <p className="text-sm font-medium text-gray-800 dark:text-white/80">
                Chat
              </p>
              <p className="max-w-sm text-xs text-gray-600 dark:text-white/55">
                AI chat is not available. Your messages will be stored locally only.
              </p>
            </motion.div>
          )}

          {visibleMessages.map((m, idx) => {
            const key = m.id;
            const isLatestUserMessage =
              m.role === "user" &&
              visibleMessages.slice(idx + 1).every((n) => n.role !== "user");
            if (m.role === "user") {
              return (
                <MessageBubble
                  key={key}
                  role="user"
                  content={m.content}
                  createdAt={m.createdAt}
                  onCopy={() => handleCopyUserMessage(m.content)}
                  onDelete={
                    isLatestUserMessage
                      ? () => handleDeleteLatestUserMessage(m.id)
                      : undefined
                  }
                  onEdit={
                    isLatestUserMessage
                      ? (edited) => handleEditUserMessage(m.id, edited)
                      : undefined
                  }
                />
              );
            }
            return (
              <div key={key} className="group">
                <MessageBubble
                  role="agent"
                  content={m.content}
                  agentName={m.agentName}
                  createdAt={m.createdAt}
                />
                <MessageActions
                  messageId={m.id}
                  messageText={m.content}
                  onFeedback={(type) => handleFeedback(m.id, type)}
                  onHide={() => handleHideMessage(m.id)}
                  feedbackState={feedbackByMessage[m.id] ?? null}
                />
              </div>
            );
          })}

        </AnimatePresence>
      </main>

      {error ? (
        <div className="shrink-0 border-t border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-[11px] text-rose-100 sm:px-5 sm:text-xs">
          {error}
        </div>
      ) : null}

      {/* Floating input - no wrapper gradient/blur; only the input bubble is visible */}
      <div
        className="fixed bottom-0 left-0 right-0 z-10 px-4 py-3 sm:px-5 sm:py-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <MessageInput
          disabled={status !== "idle" || !me?.email}
          onSend={handleSend}
          onAttach={(_files) => {
            // Attachments: extend to send images to AI when API supports vision
          }}
        />
      </div>
        </>
      )}
    </div>
  );
}

