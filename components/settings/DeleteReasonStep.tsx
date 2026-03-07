"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const REASON_OPTIONS = [
  { value: "privacy_concerns", label: "Privacy concerns" },
  { value: "not_useful", label: "I don't find it useful" },
  { value: "break", label: "I want a break" },
  { value: "better_platform", label: "Found a better platform" },
  { value: "other", label: "Other" },
] as const;

export type ReasonValue = (typeof REASON_OPTIONS)[number]["value"];

export type DeleteReasonStepProps = {
  selectedReason: ReasonValue | null;
  otherText: string;
  onReasonChange: (reason: ReasonValue) => void;
  onOtherTextChange: (text: string) => void;
  onBack: () => void;
  onContinue: () => void;
  disabled?: boolean;
};

export function DeleteReasonStep({
  selectedReason,
  otherText,
  onReasonChange,
  onOtherTextChange,
  onBack,
  onContinue,
  disabled = false,
}: DeleteReasonStepProps) {
  const canContinue =
    selectedReason &&
    (selectedReason !== "other" || otherText.trim().length > 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/60">
        Help us improve by telling us why you&apos;re leaving. (optional context)
      </p>

      <div className="space-y-2">
        {REASON_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
              selectedReason === opt.value
                ? "border-white/25 bg-white/10"
                : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
            )}
          >
            <input
              type="radio"
              name="delete-reason"
              value={opt.value}
              checked={selectedReason === opt.value}
              onChange={() => onReasonChange(opt.value)}
              className="h-3.5 w-3.5 border-white/40 text-violet-500 focus:ring-white/20"
            />
            <span className="text-sm text-white/90">{opt.label}</span>
          </label>
        ))}
      </div>

      {selectedReason === "other" && (
        <div className="space-y-1">
          <Input
            value={otherText}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="Tell us more (optional)"
            className="h-10 rounded-2xl border-white/15 bg-white/5 text-sm"
            autoFocus
          />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onBack}
          disabled={disabled}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          size="md"
          onClick={onContinue}
          disabled={!canContinue || disabled}
          className="flex-1 bg-rose-500/90 hover:bg-rose-500"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
