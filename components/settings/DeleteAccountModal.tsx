"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";
import { DeleteReasonStep, REASON_OPTIONS, type ReasonValue } from "./DeleteReasonStep";
import { DeleteConfirmStep } from "./DeleteConfirmStep";
import { softSpring, panelFade } from "@/lib/animations";

export type DeleteAccountModalProps = {
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
  onSuccess?: () => void;
};

type Step = "confirm" | "reason" | "final" | "success";

export function DeleteAccountModal({
  open,
  onClose,
  currentUserId,
  onSuccess,
}: DeleteAccountModalProps) {
  const [step, setStep] = React.useState<Step>("confirm");
  const [selectedReason, setSelectedReason] = React.useState<ReasonValue | null>(null);
  const [otherText, setOtherText] = React.useState("");
  const [confirmInput, setConfirmInput] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClose = React.useCallback(() => {
    if (submitting) return;
    setStep("confirm");
    setSelectedReason(null);
    setOtherText("");
    setConfirmInput("");
    setError(null);
    onClose();
  }, [onClose, submitting]);

  const handleDelete = React.useCallback(async () => {
    const reasonDisplay =
      !selectedReason
        ? "Not specified"
        : selectedReason === "other"
          ? otherText.trim() || "Other"
          : REASON_OPTIONS.find((o) => o.value === selectedReason)?.label ?? selectedReason;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          reason: reasonDisplay,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setStep("success");
      onSuccess?.();
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login?deleted=1";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule deletion.");
    } finally {
      setSubmitting(false);
    }
  }, [currentUserId, selectedReason, otherText, onSuccess]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        aria-modal
        aria-labelledby="delete-account-title"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={softSpring}
          className="relative z-10 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel className="p-6 shadow-xl">
            <AnimatePresence mode="wait">
              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  variants={panelFade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={softSpring}
                  className="space-y-4"
                >
                  <h2
                    id="delete-account-title"
                    className="text-lg font-semibold text-white"
                  >
                    Delete your Circle account?
                  </h2>
                  <p className="text-sm text-white/70">
                    This action cannot be undone. All your conversations, AI
                    persona, and account data will be permanently deleted.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={handleClose}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="md"
                      onClick={() => setStep("reason")}
                      disabled={submitting}
                      className="flex-1 bg-rose-500/90 hover:bg-rose-500"
                    >
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === "reason" && (
                <motion.div
                  key="reason"
                  variants={panelFade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={softSpring}
                >
                  <h2 className="text-lg font-semibold text-white">
                    Why are you leaving?
                  </h2>
                  <DeleteReasonStep
                    selectedReason={selectedReason}
                    otherText={otherText}
                    onReasonChange={setSelectedReason}
                    onOtherTextChange={setOtherText}
                    onBack={() => setStep("confirm")}
                    onContinue={() => setStep("final")}
                    disabled={submitting}
                  />
                </motion.div>
              )}

              {step === "final" && (
                <motion.div
                  key="final"
                  variants={panelFade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={softSpring}
                >
                  <h2 className="text-lg font-semibold text-white">
                    Final confirmation
                  </h2>
                  {error && (
                    <p className="text-xs text-rose-400">{error}</p>
                  )}
                  <DeleteConfirmStep
                    confirmInput={confirmInput}
                    onConfirmInputChange={setConfirmInput}
                    onBack={() => setStep("reason")}
                    onDelete={() => void handleDelete()}
                    disabled={submitting}
                    selectedReason={selectedReason}
                    otherText={otherText}
                  />
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  variants={panelFade}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={softSpring}
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold text-white">
                    Account scheduled for deletion
                  </h2>
                  <p className="text-sm text-white/70">
                    Your account is scheduled for deletion. If this was a
                    mistake, you can cancel within 7 days.
                  </p>
                  <Button
                    type="button"
                    size="md"
                    onClick={handleClose}
                    className="w-full"
                  >
                    Close
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
