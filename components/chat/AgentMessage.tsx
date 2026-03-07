import * as React from "react";
import { motion } from "framer-motion";
import { MessageBubble, type MessageBubbleProps } from "./MessageBubble";

export type AgentMessageProps = Omit<MessageBubbleProps, "role"> & {
  accent?: "cyan" | "violet" | "amber" | "emerald" | "rose";
};

const accentRing: Record<
  NonNullable<AgentMessageProps["accent"]>,
  string
> = {
  cyan: "ring-cyan-400/30",
  violet: "ring-violet-400/30",
  amber: "ring-amber-400/30",
  emerald: "ring-emerald-400/30",
  rose: "ring-rose-400/30",
};

export function AgentMessage({
  accent = "violet",
  ...props
}: AgentMessageProps) {
  return (
    <motion.div
      layout
      className={accentRing[accent] ? `ring-1 ${accentRing[accent]} rounded-3xl` : ""}
    >
      <MessageBubble role="agent" {...props} />
    </motion.div>
  );
}

