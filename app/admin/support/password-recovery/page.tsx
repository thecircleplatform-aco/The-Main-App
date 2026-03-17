"use client";

import * as React from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";

type RecoveryRequest = {
  id: string;
  email: string;
  reason: string;
  status: string;
  ip_address: string | null;
  created_at: string;
};

export default function AdminPasswordRecoveryPage() {
  const [requests, setRequests] = React.useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState<string | null>(null);
  const [resetLink, setResetLink] = React.useState<string | null>(null);

  const fetchRequests = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support/password-recovery");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to load");
        return;
      }
      setRequests(data.requests ?? []);
      setError(null);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function runAction(action: "approve" | "reject" | "force_reset", requestId: string) {
    setActing(requestId);
    setResetLink(null);
    try {
      const res = await fetch("/api/admin/support/password-recovery/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requestId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Action failed");
        return;
      }
      if (data.resetLink) setResetLink(data.resetLink);
      fetchRequests();
    } finally {
      setActing(null);
    }
  }

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
    } catch {
      return s;
    }
  };

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Password Recovery Requests</h2>
        <p className="mt-1 text-xs text-white/55">
          Users who cannot access their email can request manual recovery. Approve to send a reset link; reject to decline.
        </p>
        <p className="mt-2">
          <Link
            href="/admin/support"
            className="text-xs text-violet-400 hover:text-violet-300"
          >
            ← Support tickets
          </Link>
        </p>
      </GlassPanel>

      {resetLink && (
        <GlassPanel className="p-4 border border-emerald-500/30">
          <p className="text-xs text-white/70 mb-2">Reset link (copy and send to user if needed):</p>
          <code className="block text-xs text-emerald-300 break-all bg-black/30 p-2 rounded">
            {resetLink}
          </code>
          <button
            type="button"
            className="mt-2 text-xs text-violet-400 hover:underline"
            onClick={() => setResetLink(null)}
          >
            Dismiss
          </button>
        </GlassPanel>
      )}

      <GlassPanel className="p-5">
        {loading && <p className="text-sm text-white/60">Loading…</p>}
        {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 text-white/70">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Reason</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white/85">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-white/50">
                      No password recovery requests yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="border-b border-white/8 hover:bg-white/5">
                      <td className="py-2 pr-4 text-white/70">{formatDate(r.created_at)}</td>
                      <td className="py-2 pr-4">{r.email}</td>
                      <td className="py-2 pr-4 max-w-xs truncate" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="py-2 pr-4 capitalize">{r.status}</td>
                      <td className="py-2">
                        {r.status === "pending" && (
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="md"
                              variant="ghost"
                              className="h-7 text-xs border border-white/20"
                              disabled={!!acting}
                              onClick={() => runAction("approve", r.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="md"
                              variant="ghost"
                              className="h-7 text-xs border border-rose-400/50 text-rose-400"
                              disabled={!!acting}
                              onClick={() => runAction("reject", r.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              size="md"
                              variant="ghost"
                              className="h-7 text-xs border border-amber-400/50 text-amber-400"
                              disabled={!!acting}
                              onClick={() => runAction("force_reset", r.id)}
                            >
                              Force reset
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
