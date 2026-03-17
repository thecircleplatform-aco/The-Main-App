"use client";

import * as React from "react";
import { Hand } from "lucide-react";
import { cn } from "@/lib/utils";

type SeatRequestButtonProps = {
  status: "idle" | "pending" | "accepted" | "rejected";
  onRequest: () => void;
};

export function SeatRequestButton({ status, onRequest }: SeatRequestButtonProps) {
  const disabled = status === "pending" || status === "accepted";
  const label =
    status === "pending"
      ? "Request sent"
      : status === "accepted"
      ? "You’re a speaker"
      : "Request to Speak";

  return (
    <button
      type="button"
      onClick={onRequest}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
        disabled
          ? "bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-white/50 cursor-default"
          : "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400"
      )}
    >
      <Hand className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

