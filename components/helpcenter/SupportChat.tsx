"use client";

import * as React from "react";
import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useSession } from "@/hooks/useSession";

export function SupportChat() {
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/support/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          userId: session?.id ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to submit. Please try again.");
        return;
      }
      setSubmitted(true);
      setMessage("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center gap-2 text-gray-800 dark:text-white/80">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-sm font-semibold">Contact Support</h2>
      </div>
      <p className="mt-2 text-xs text-gray-600 dark:text-white/60">
        Submit a message and our team will review your case. Include your email
        if you&apos;re not logged in.
      </p>
      {submitted ? (
        <p className="mt-4 text-sm text-emerald-400">
          Thank you. Your message has been submitted. We&apos;ll get back to you
          soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="support-message" className="sr-only">
              Message
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your situation and why you believe this is a mistake..."
              rows={4}
              maxLength={2000}
              disabled={loading}
              required
              className="h-24 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-soft backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-white/15"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Submit"}
          </Button>
        </form>
      )}
    </GlassPanel>
  );
}
