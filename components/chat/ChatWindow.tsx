"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, Brain, X, Menu, Settings, FileText, Shield, Sparkles, User, LogIn, UserPlus, LogOut } from "lucide-react";
import { AccountRecoveryView } from "@/components/account/AccountRecoveryView";
import type { EngineMessage } from "@/services/aiEngine";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { StreamingMessage } from "./StreamingMessage";
import { MessageActions } from "./MessageActions";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";
import { CREW } from "@/lib/crew";

type ChatMessage = EngineMessage;

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
    return parsed.filter((m: ChatMessage) => !m.internal);
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
  const [internalMessages, setInternalMessages] = React.useState<EngineMessage[]>([]);
  const [showInternalPanel, setShowInternalPanel] = React.useState(false);
  const [showSideMenu, setShowSideMenu] = React.useState(false);
  /** Per-message feedback: messageId -> "helpful" | "not_helpful" */
  const [feedbackByMessage, setFeedbackByMessage] = React.useState<Record<string, "helpful" | "not_helpful">>({});
  /** Current stream mode: chat (fast) or reasoning */
  const [streamingMode, setStreamingMode] = React.useState<"chat" | "reasoning" | null>(null);
  const [me, setMe] = React.useState<{
    id: string | null;
    email: string | null;
    name?: string;
    deletionScheduledAt?: string | null;
  } | null>(null);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const internalScrollRef = React.useRef<HTMLDivElement | null>(null);
  const isSendingRef = React.useRef(false);

  React.useEffect(() => {
    if (me?.id) {
      setMessages(loadInitialMessages(me.id));
    }
  }, [me?.id]);

  // Must be signed in to use chat; redirect to login if not
  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : { id: null, email: null, name: null, deletionScheduledAt: null }))
      .then((data) => {
        setMe({ ...data, id: data.id ?? null });
        if (data.email == null) {
          const from = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
          window.location.href = "/login?from=" + encodeURIComponent(from);
        }
      })
      .catch(() => {
        setMe({ id: null, email: null, deletionScheduledAt: null });
        window.location.href = "/login";
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
    const el = internalScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [internalMessages]);

  React.useEffect(() => {
    if (!showSideMenu) return;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : { email: null, name: null, deletionScheduledAt: null }))
      .then((data) => setMe(data))
      .catch(() => { /* keep previous me on refetch failure */ });
  }, [showSideMenu]);

  async function handleSend(userText: string, overrideHistory?: ChatMessage[]) {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setError(null);
    setStreamingMode(null);
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    const historyForApi = overrideHistory ?? messages;
    const history = [...historyForApi, userMessage];
    setMessages(history);
    setStatus("sending");

    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId =
      typeof window !== "undefined" && controller
        ? setTimeout(() => controller.abort(), 55_000)
        : undefined;

    try {
      const res = await fetch("/api/ai-discussion/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          history: historyForApi,
        }),
        ...(controller ? { signal: controller.signal } : {}),
      });

      if (timeoutId != null) clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        let errMessage = text || `Request failed (${res.status})`;
        try {
          const j = JSON.parse(text);
          if (j?.error) errMessage = j.error;
        } catch {
          /* use errMessage as is */
        }
        throw new Error(errMessage);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let currentContent = "";
      let streamingAgent: string | null = null;
      let streamingMessageId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7).trim();
            let dataLine: string | undefined;
            for (let j = i + 1; j < lines.length; j++) {
              if (lines[j].startsWith("data: ")) {
                dataLine = lines[j];
                break;
              }
              if (lines[j].trim() !== "") break;
            }
            if (!dataLine?.startsWith("data: ")) continue;
            const data = (() => {
              try {
                return JSON.parse(dataLine.slice(6));
              } catch {
                return null;
              }
            })();

            if (eventType === "intro" && data?.messages) {
              setMessages((prev) => [...prev, ...data.messages]);
              setStatus("idle");
              setStreamingMode(null);
              return;
            }
            if (eventType === "started" && data?.situation) {
              setStreamingMode(data.situation === "reasoning" ? "reasoning" : "chat");
            }
            if (eventType === "content" && typeof data?.chunk === "string") {
              currentContent += data.chunk;
              if (!streamingMessageId) {
                streamingMessageId = `msg_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
                streamingAgent = "Lumana";
              }
              setMessages((prev) => {
                const without = prev.filter((m) => m.id !== streamingMessageId);
                return [
                  ...without,
                  {
                    id: streamingMessageId!,
                    role: "agent" as const,
                    content: currentContent,
                    agentName: streamingAgent ?? "Circle",
                    createdAt: new Date().toISOString(),
                  },
                ];
              });
            }
            if (eventType === "done" && data) {
              streamingAgent = data.agent ?? streamingAgent ?? "Lumana";
              setStreamingMode(null);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingMessageId
                    ? { ...m, agentName: streamingAgent ?? m.agentName }
                    : m
                )
              );
              setStatus("idle");
            }
            if (eventType === "error" && data?.error) {
              setError(data.error);
              setStatus("idle");
              setStreamingMode(null);
              return;
            }
          }
        }
      }

      setStatus("idle");
      setStreamingMode(null);
    } catch (e) {
      if (timeoutId != null) clearTimeout(timeoutId);
      if (e instanceof Error) {
        if (e.name === "AbortError") {
          setError("Request timed out. Check your connection and try again.");
        } else {
          setError(e.message || "Something went wrong");
        }
      } else {
        setError("Something went wrong");
      }
      setStatus("idle");
      setStreamingMode(null);
    } finally {
      isSendingRef.current = false;
    }
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

  const isBusy = status === "sending" || status === "thinking";
  const showRecoveryForm = Boolean(me?.email && me?.deletionScheduledAt);
  const visibleMessages = React.useMemo(
    () => messages.filter((m) => !m.internal),
    [messages]
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-black/95">
      {/* Fixed header */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] bg-black/90 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSideMenu(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/15 focus:ring-offset-2 focus:ring-offset-black/90"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="min-w-0">
          <button
            type="button"
            onClick={() => setShowInternalPanel((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/60 transition-colors sm:px-3 sm:py-1 sm:text-[11px]",
              "hover:bg-white/8 hover:text-white/80",
              "focus:outline-none focus:ring-2 focus:ring-white/15 focus:ring-offset-2 focus:ring-offset-black/90"
            )}
            aria-expanded={showInternalPanel}
            aria-label={showInternalPanel ? "Hide agent group discussion" : "Show how AI agents think and plan as a group"}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="truncate">Crew chat</span>
          </button>
          <h2 className="mt-1.5 truncate text-xs font-semibold text-white/90 sm:mt-2 sm:text-sm">
            Personal AI Crew
          </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-white/50 sm:text-xs">
          {isBusy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" strokeWidth={2} />
              {streamingMode ? (
                <span className="truncate font-medium text-white/70">
                  {streamingMode === "reasoning" ? "Reasoning…" : "Replying…"}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-white/60">Ready</span>
          )}
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
              className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
              aria-hidden
              onClick={() => setShowSideMenu(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed left-0 top-0 z-30 flex h-full w-72 max-w-[85vw] flex-col border-r border-white/10 bg-black/95 shadow-xl backdrop-blur-2xl"
            >
              <div className="flex shrink-0 flex-col gap-0.5 border-b border-white/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/90">Circle</span>
                    <button
                    type="button"
                    onClick={() => setShowSideMenu(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-white/50">powered by ACO Network</p>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
                <Link
                  href="/settings"
                  onClick={() => setShowSideMenu(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Settings className="h-4 w-4 text-white/60" />
                  Settings
                </Link>
                <Link
                  href="/privacy"
                  onClick={() => setShowSideMenu(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Shield className="h-4 w-4 text-white/60" />
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  onClick={() => setShowSideMenu(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <FileText className="h-4 w-4 text-white/60" />
                  Terms
                </Link>
                <Link
                  href="/ai-policy"
                  onClick={() => setShowSideMenu(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Sparkles className="h-4 w-4 text-white/60" />
                  AI policy
                </Link>
                {me?.email ? null : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setShowSideMenu(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <LogIn className="h-4 w-4 text-white/60" />
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowSideMenu(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <UserPlus className="h-4 w-4 text-white/60" />
                      Register
                    </Link>
                  </>
                )}
              </nav>
              <div className="flex shrink-0 flex-col gap-0.5 border-t border-white/10 px-4 py-3">
                {me?.email ? (
                  <>
                    <Link
                      href="/settings"
                      onClick={() => setShowSideMenu(false)}
                      className="flex items-center gap-3 transition-colors hover:bg-white/5 rounded-xl px-2 py-2 -mx-2"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                        <User className="h-5 w-5 text-white/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {me.name && (
                          <p className="truncate text-xs font-medium text-white/90">
                            {me.name}
                          </p>
                        )}
                        <p className="truncate text-[11px] text-white/60">
                          {me.email}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/40">Tap for Settings</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        setMe({ id: null, email: null });
                        setShowSideMenu(false);
                        window.location.reload();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <LogOut className="h-4 w-4 text-white/60" />
                      Log out
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <User className="h-5 w-5 text-white/50" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-white/50">Not signed in</p>
                      <p className="mt-0.5 text-[10px] text-white/40">
                        Log in or register to save your progress
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Internal discussion panel (how agents think as a group) */}
      <AnimatePresence>
        {showInternalPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-10 flex flex-col bg-black/90 backdrop-blur-sm"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/80 px-3 py-2 sm:px-4 sm:py-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-300" />
                <div>
                  <h3 className="text-sm font-semibold text-white/90">
                    How the council thinks
                  </h3>
                  <p className="text-[10px] text-white/50 sm:text-[11px]">
                    Internal debate and planning — agents exchange perspectives before replying to you
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInternalPanel(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              ref={internalScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4"
            >
              {internalMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-xs text-white/50">
                  <Brain className="h-10 w-10 text-white/20" />
                  <p>
                    {isBusy
                      ? "Agents are debating… their internal discussion will appear here after they reply."
                      : "Send a message to see how the council thinks and plans as a group."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {internalMessages.map((m) => {
                    const label = m.agentName ?? m.agentId ?? "Agent";
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex w-full gap-2"
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[10px] font-semibold text-white/80">
                          {String(label).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 text-[10px] text-white/50">
                            <span>{label}</span>
                            <span className="rounded bg-white/10 px-1.5 py-[1px] text-[9px] uppercase tracking-wide text-white/40">
                              internal
                            </span>
                            {m.createdAt && (
                              <span className="text-white/35">
                                {new Date(m.createdAt).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/80 backdrop-blur-xl">
                            {m.content.split("\n").map((line, i) => (
                              <p key={i} className="whitespace-pre-wrap">
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account recovery form when deletion is scheduled */}
      {showRecoveryForm ? (
        <AccountRecoveryView onRecovered={() => setMe((m) => m ? { ...m, deletionScheduledAt: null } : m)} />
      ) : (
        <>
      {/* Full-screen scrollable content */}
      <main
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 sm:px-5 sm:py-4"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {/* Crew list — who you can call before reasoning starts */}
        {visibleMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl"
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/50 sm:text-[11px]">
              Your crew
            </span>
            {CREW.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70 sm:text-[11px]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-white/80">
                  {c.name.slice(0, 2)}
                </span>
                <span className="font-medium">{c.name}</span>
                <span className="text-white/45">·</span>
                <span className="text-white/55">{c.description}</span>
              </span>
            ))}
          </motion.div>
        )}

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
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/80">
                  Circle AI
                </p>
                <p className="max-w-sm text-xs text-white/55">
                  Lumana is your default companion. Say hi to start. To reach Sam, Alex, Maya, or Nova, call them by name.
                </p>
              </div>
              <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {CREW.map((c, i) => (
                  <motion.div
                    key={c.id}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur-xl"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-white/80">
                      {c.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/85">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-white/55">
                        {c.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="text-[11px] text-white/45">
                Say hello to start — Lumana will reply.
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
            const isLastMessage = visibleMessages.indexOf(m) === visibleMessages.length - 1;
            const isStreamingMessage = isBusy && isLastMessage;
            return (
              <div key={key} className="group">
                <StreamingMessage
                  content={m.content}
                  agentName={m.agentName ?? "Lumana"}
                  createdAt={m.createdAt}
                  isStreaming={isStreamingMessage}
                  actionSlot={
                    <MessageActions
                      messageId={m.id}
                      messageText={m.content}
                      onFeedback={(type) => handleFeedback(m.id, type)}
                      onHide={() => handleHideMessage(m.id)}
                      feedbackState={feedbackByMessage[m.id] ?? null}
                    />
                  }
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

      {/* Fixed footer */}
      <footer className="shrink-0 border-t border-white/[0.06] bg-black/90 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
        <MessageInput disabled={status !== "idle" || !me?.email} onSend={handleSend} />
      </footer>
        </>
      )}
    </div>
  );
}

