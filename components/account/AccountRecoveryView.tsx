"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";
import { fadeInUp, softSpring } from "@/lib/animations";

export type AccountRecoveryViewProps = {
  onRecovered?: () => void;
};

export function AccountRecoveryView({ onRecovered }: AccountRecoveryViewProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function handleRecover() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/recover", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setSuccess(true);
      onRecovered?.();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to recover account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={softSpring}
    >
      <GlassPanel className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
            <ShieldAlert className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Account scheduled for deletion
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Your account is scheduled for deletion. You cannot chat until you
              recover it. You have 7 days to cancel the deletion.
            </p>
          </div>
          {error && (
            <p className="text-xs text-rose-400" role="alert">
              {error}
            </p>
          )}
          <Button
            type="button"
            size="lg"
            onClick={() => void handleRecover()}
            disabled={loading || success}
            className="w-full"
          >
            {loading ? "Recovering…" : success ? "Recovered" : "Recover my account"}
          </Button>
          <p className="text-[11px] text-white/45">
            This will cancel the deletion and restore full access to your
            account.
          </p>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
