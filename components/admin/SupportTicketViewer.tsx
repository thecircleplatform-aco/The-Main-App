"use client";

import * as React from "react";
import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type Ticket = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

type SupportTicketViewerProps = {
  tickets: Ticket[];
};

export function SupportTicketViewer({ tickets: initialTickets }: SupportTicketViewerProps) {
  const [tickets, setTickets] = React.useState(initialTickets);
  const [selected, setSelected] = React.useState<Ticket | null>(null);
  const [response, setResponse] = React.useState("");
  const [unblockUser, setUnblockUser] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/support/tickets");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setTickets(data.tickets ?? []);
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !response.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selected.id,
          responseMessage: response.trim(),
          unblockUser,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to respond");
        return;
      }
      setResponse("");
      setUnblockUser(false);
      setSelected(null);
      await refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <GlassPanel className="flex-1 p-5">
        <h3 className="text-sm font-semibold text-white">Tickets</h3>
        <p className="mt-1 text-xs text-white/55">
          View and respond to support requests from blocked users.
        </p>
        <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2">
          {tickets.length === 0 ? (
            <p className="py-8 text-center text-xs text-white/50">
              No support tickets yet.
            </p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelected(t);
                  setResponse("");
                  setUnblockUser(false);
                }}
                className={`w-full rounded-2xl border p-3 text-left text-xs transition ${
                  selected?.id === t.id
                    ? "border-white/20 bg-white/15 text-white"
                    : "border-white/8 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                <div className="font-medium">
                  {t.user_email ?? t.user_name ?? "Anonymous"}
                </div>
                <div className="mt-1 truncate text-white/60">{t.message}</div>
                <div className="mt-1 text-white/40">
                  {new Date(t.created_at).toLocaleString()} • {t.status}
                </div>
              </button>
            ))
          )}
        </div>
      </GlassPanel>

      {selected && (
        <GlassPanel className="relative flex-1 p-6">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-sm font-semibold text-white">Ticket details</h3>
          <p className="mt-1 text-xs text-white/55">
            {selected.user_email ?? "No email"} • {selected.user_name ?? "—"}
          </p>
          <div className="mt-4 space-y-4">
            <section>
              <h4 className="text-xs font-medium text-white/70">Message</h4>
              <p className="mt-1 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                {selected.message}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {new Date(selected.created_at).toLocaleString()}
              </p>
            </section>
            {selected.admin_response && (
              <section>
                <h4 className="text-xs font-medium text-white/70">
                  Previous response
                </h4>
                <p className="mt-1 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                  {selected.admin_response}
                </p>
              </section>
            )}
            <form onSubmit={handleRespond} className="space-y-4">
              <div>
                <label
                  htmlFor="response"
                  className="mb-1.5 block text-xs font-medium text-white/70"
                >
                  Response
                </label>
                <textarea
                  id="response"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                  maxLength={2000}
                  disabled={loading}
                  required
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/15 disabled:opacity-50"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unblockUser}
                  onChange={(e) => setUnblockUser(e.target.checked)}
                  className="rounded border-white/20"
                />
                <span className="text-sm text-white/70">
                  Unblock user (restore account)
                </span>
              </label>
              {error && (
                <p className="text-sm text-rose-400" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send response"}
              </Button>
            </form>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
