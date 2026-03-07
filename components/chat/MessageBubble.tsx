import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp, avatarPulse, softSpring } from "@/lib/animations";

export type MessageBubbleProps = {
  role: "user" | "agent" | "system";
  content: string;
  agentName?: string;
  createdAt?: string;
};

export function MessageBubble({
  role,
  content,
  agentName,
  createdAt,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      layout
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ ...softSpring, mass: 0.6 }}
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <motion.div
          className="mt-1 h-8 w-8 shrink-0 rounded-2xl bg-white/10 text-xs font-semibold text-white/90 shadow-soft backdrop-blur-xl flex items-center justify-center"
          variants={avatarPulse}
          initial="rest"
          animate="pulse"
        >
          {(agentName ?? "AI")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)}
        </motion.div>
      )}

      <div className={cn("max-w-[80%] space-y-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-soft backdrop-blur-2xl",
            isUser
              ? "ml-auto bg-white text-black"
              : "glass bg-white/7 text-white/90 border border-white/12"
          )}
        >
          {content.split("\n").map((line, idx) => (
            <p
              key={idx}
              className={cn(
                "whitespace-pre-wrap",
                idx > 0 ? "mt-1" : undefined
              )}
            >
              {line}
            </p>
          ))}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 text-[11px] text-white/40",
            isUser ? "justify-end pr-2" : "justify-start pl-1"
          )}
        >
          {agentName && !isUser ? <span>{agentName}</span> : null}
          {createdAt ? (
            <span>
              {new Date(createdAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

