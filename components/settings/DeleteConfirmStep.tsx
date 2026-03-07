"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReasonValue } from "./DeleteReasonStep";

const CONFIRM_TEXT = "DELETE";

export type DeleteConfirmStepProps = {
  confirmInput: string;
  onConfirmInputChange: (value: string) => void;
  onBack: () => void;
  onDelete: () => void;
  disabled?: boolean;
  selectedReason?: ReasonValue | null;
  otherText?: string;
};

export function DeleteConfirmStep({
  confirmInput,
  onConfirmInputChange,
  onBack,
  onDelete,
  disabled = false,
}: DeleteConfirmStepProps) {
  const isConfirmed = confirmInput.trim() === CONFIRM_TEXT;

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/70">
        Type <span className="font-mono font-semibold text-rose-400">{CONFIRM_TEXT}</span> to confirm.
      </p>

      <Input
        value={confirmInput}
        onChange={(e) => onConfirmInputChange(e.target.value)}
        placeholder="Type DELETE"
        className="h-11 rounded-2xl border-white/15 bg-white/5 text-center font-mono text-sm tracking-wider placeholder:text-white/30"
        autoComplete="off"
        spellCheck={false}
      />

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
          onClick={onDelete}
          disabled={!isConfirmed || disabled}
          className="flex-1 bg-rose-500/90 hover:bg-rose-500 disabled:opacity-50"
        >
          Delete account
        </Button>
      </div>
    </div>
  );
}
