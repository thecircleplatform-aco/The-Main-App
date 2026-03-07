"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, PauseCircle } from "lucide-react";
import type { EngineMessage, Insight } from "@/services/aiEngine";
import { GlassPanel } from "@/components/glass-panel";
import { cn } from "@/lib/utils";
import { panelFade, fadeInUp, softSpring } from "@/lib/animations";

type DiscussionBoardProps = {
  messages: EngineMessage[];
  insight?: Insight | null;
  /**
   * Whether the engine has paused the discussion
   * (e.g. after a given number of rounds).
   */
  paused?: boolean;
  className?: string;
};

export function DiscussionBoard({
  messages,
  insight,
  paused,
  className,
}: DiscussionBoardProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const internalMessages = React.useMemo(
    () =>
      messages.filter(
        (m) => m.role !== "user" // user never appears here
      ),
    [messages]
  );

  return (
    <GlassPanel
      className={cn(
        "flex h-[420px] flex-col border-white/15 bg-black/40 p-0 shadow-soft",
        className
      )}
    >
      <motion.div
        variants={panelFade}
        initial="hidden"
        animate="visible"
        transition={{ ...softSpring, delay: 0.03 }}
        className="flex h-full flex-col p-4 sm:p-5 md:p-6"
      >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-xl">
            <Sparkles className="h-3 w-3 text-violet-200" />
            Internal council debate
          </div>
          <h2 className="mt-2 text-sm font-semibold text-white/90">
            AI Discussion Board
          </h2>
          <p className="mt-1 text-[11px] text-white/45">
            Agents exchange perspectives here. You can observe but not
            intervene.
          </p>
        </div>
        {paused ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-3 py-1 text-[11px] text-white/70 backdrop-blur-xl">
            <PauseCircle className="h-3 w-3 text-amber-300" />
            <span>Discussion paused</span>
          </div>
        ) : null}
      </header>

      {insight ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 rounded-3xl border border-emerald-400/25 bg-emerald-400/8 px-4 py-3 text-xs text-emerald-50 shadow-soft backdrop-blur-2xl"
        >
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Insight highlight
          </div>
          <div className="text-[13px] font-semibold text-emerald-50">
            {insight.title}
          </div>
          <div className="mt-1 whitespace-pre-wrap text-[12px] text-emerald-100/90">
            {insight.summary}
          </div>
        </motion.div>
      ) : null}

      <div
        ref={containerRef}
        className="relative flex-1 space-y-2 overflow-y-auto rounded-3xl border border-white/10 bg-black/30 p-3 pr-2 backdrop-blur-2xl"
      >
        <AnimatePresence initial={false}>
          {internalMessages.length === 0 && (
            <motion.div
              key="empty"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center text-center text-xs text-white/45"
            >
              Once the council starts debating, their internal messages will
              appear here.
            </motion.div>
          )}

          {internalMessages.map((m, idx) => {
            const isSystem = m.role === "system" || m.internal;
            const label = m.agentName ?? m.agentId ?? "Agent";

            return (
              <motion.div
                key={m.id}
                layout
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: 4 }}
                transition={{
                  duration: 0.18,
                  delay: Math.min(idx * 0.02, 0.12),
                }}
                className="flex w-full gap-3"
              >
                <div className="mt-1 h-7 w-7 shrink-0 rounded-2xl bg-white/8 text-[11px] font-semibold text-white/85 shadow-soft backdrop-blur-xl flex items-center justify-center">
                  {label
                    .toString()
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="max-w-[82%] space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    <span>{label}</span>
                    {isSystem ? (
                      <span className="rounded-full bg-white/8 px-2 py-[2px] text-[10px] uppercase tracking-wide text-white/55">
                        internal
                      </span>
                    ) : null}
                    {m.createdAt ? (
                      <span className="text-white/35">
                        {new Date(m.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/6 px-4 py-2.5 text-[12px] leading-relaxed text-white/90 shadow-soft backdrop-blur-2xl">
                    {m.content.split("\n").map((line, i) => (
                      <p
                        key={i}
                        className={cn(
                          "whitespace-pre-wrap",
                          i > 0 ? "mt-1" : undefined
                        )}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {paused && internalMessages.length > 0 && (
            <motion.div
              key="pause-marker"
              layout
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 4 }}
              className="mt-3 flex items-center justify-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1.5 text-[11px] text-amber-50 backdrop-blur-xl">
                <PauseCircle className="h-3 w-3" />
                <span>The council has paused this discussion.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>
    </GlassPanel>
  );
}

