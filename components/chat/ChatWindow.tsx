"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, Brain, X, Menu, Settings, FileText, Shield, Sparkles, User, LogIn, UserPlus, LogOut } from "lucide-react";
import { AccountRecoveryView } from "@/components/account/AccountRecoveryView";
import type { DiscussionResult, EngineMessage } from "@/services/aiEngine";
import { MessageBubble } from "./MessageBubble";
import { AgentMessage } from "./AgentMessage";
import { MessageInput } from "./MessageInput";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";
import { CREW } from "@/lib/crew";

type ChatMessage = EngineMessage;

const STORAGE_KEY = "circle.chat.history.v1";

type Status = "idle" | "sending" | "thinking";

function loadInitialMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Only show user-facing messages; internal council messages stay server-side
    return parsed.filter((m: ChatMessage) => !m.internal);
  } catch {
    return [];
  }
}

function persistMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
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
  const [me, setMe] = React.useState<{
    email: string | null;
    name?: string;
    deletionScheduledAt?: string | null;
  } | null>(null);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const internalScrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMessages(loadInitialMessages());
  }, []);

  // Must be signed in to use chat; redirect to login if not
  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : { email: null, name: null, deletionScheduledAt: null }))
      .then((data) => {
        setMe(data);
        if (data.email == null) {
          const from = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
          window.location.href = "/login?from=" + encodeURIComponent(from);
        }
      })
      .catch(() => {
        setMe({ email: null, deletionScheduledAt: null });
        window.location.href = "/login";
      });
  }, []);

  React.useEffect(() => {
    if (messages.length) {
      persistMessages(messages);
    }
  }, [messages]);

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
      .catch(() => setMe({ email: null, deletionScheduledAt: null }));
  }, [showSideMenu]);

  async function revealSequentially(
    base: ChatMessage[],
    incoming: ChatMessage[]
  ) {
    setStatus("thinking");
    let current = [...base];
    for (const msg of incoming) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      current = [...current, msg];
      setMessages(current);
    }
    setStatus("idle");
  }

  async function handleSend(userText: string) {
    setError(null);
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    const history = [...messages, userMessage];
    setMessages(history);
    setStatus("sending");

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    if (typeof window !== "undefined" && controller) {
      timeoutId = setTimeout(() => controller.abort(), 55_000);
    }

    try {
      const res = await fetch("/api/ai-discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          history: messages,
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
          // use errMessage as is
        }
        throw new Error(errMessage);
      }

      const data = (await res.json()) as DiscussionResult;

      const knownIds = new Set(history.map((m) => m.id));
      const incoming = (data.messages ?? []).filter(
        (m) =>
          !knownIds.has(m.id) && m.role !== "user" && !m.internal
      );

      if (data.messages?.length) {
        const internal = data.messages.filter((m) => m.internal);
        setInternalMessages(internal);
      }

      if (!incoming.length) {
        return;
      }

      await revealSequentially(history, incoming);
    } catch (e) {
      if (e instanceof Error) {
        if (e.name === "AbortError") {
          setError("Request timed out. Check your connection and try again.");
        } else {
          setError(e.message || "Something went wrong");
        }
      } else {
        setError("Something went wrong");
      }
    } finally {
      if (timeoutId != null) clearTimeout(timeoutId);
      setStatus("idle");
    }
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
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/80 px-3 py-2 backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSideMenu(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black/80"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
          <button
            type="button"
            onClick={() => setShowInternalPanel((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/70 transition-colors sm:px-3 sm:py-1 sm:text-[11px]",
              "hover:bg-white/10 hover:border-white/20 hover:text-white/90",
              "focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black/80"
            )}
            aria-expanded={showInternalPanel}
            aria-label={showInternalPanel ? "Hide agent group discussion" : "Show how AI agents think and plan as a group"}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="truncate">Live multi-agent chat</span>
          </button>
          <h2 className="mt-1.5 truncate text-xs font-semibold text-white/90 sm:mt-2 sm:text-sm">
            Council discussion
          </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[10px] text-white/45 sm:text-[11px]">
          {isBusy ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">Council is thinking…</span>
            </>
          ) : (
            <span>Ready</span>
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
                        setMe({ email: null });
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
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-2 sm:px-4 sm:py-3"
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
                  Your council crew
                </p>
                <p className="max-w-sm text-xs text-white/55">
                  Call them when you need to plan. Send a message to bring the
                  team in — then the reasoning starts and the team comes.
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
                Type something like “call our team” or describe your idea to get
                the council going.
              </p>
            </motion.div>
          )}

          {visibleMessages.map((m) => {
            const key = m.id;
            if (m.role === "user") {
              return (
                <MessageBubble
                  key={key}
                  role="user"
                  content={m.content}
                  createdAt={m.createdAt}
                />
              );
            }
            return (
              <AgentMessage
                key={key}
                content={m.content}
                agentName={m.agentName ?? "Agent"}
                createdAt={m.createdAt}
              />
            );
          })}

          {isBusy && (
            <motion.div
              key="typing"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="mt-2 flex items-center gap-2 text-[11px] text-white/55"
            >
              <div className="flex h-7 items-center rounded-2xl bg-white/10 px-3 backdrop-blur-xl">
                <span className={cn("mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300")} />
                <span className="inline-flex gap-1">
                  <span className="animate-bounce delay-[0ms]">●</span>
                  <span className="animate-bounce delay-[100ms]">●</span>
                  <span className="animate-bounce delay-[200ms]">●</span>
                </span>
              </div>
              <span>Agents are typing</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {error ? (
        <div className="shrink-0 border-t border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-100 sm:px-4 sm:text-[11px]">
          {error}
        </div>
      ) : null}

      {/* Fixed footer */}
      <footer className="shrink-0 border-t border-white/10 bg-black/80 px-3 py-2 backdrop-blur-xl sm:px-4 sm:py-3">
        <MessageInput disabled={status !== "idle" || !me?.email} onSend={handleSend} />
      </footer>
        </>
      )}
    </div>
  );
}

