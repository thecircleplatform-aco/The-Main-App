"use client";

import * as React from "react";
import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";

type AuthEvent = {
  id: string;
  user_id: string | null;
  ip_address: string;
  device_fingerprint: string | null;
  event_type: string;
  risk_score: number;
  details: Record<string, unknown>;
  created_at: string;
  email: string | null;
};

export default function AdminSuspiciousActivityPage() {
  const [events, setEvents] = React.useState<AuthEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState<string | null>(null);

  const fetchEvents = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/security/suspicious-activity?limit=100&minRisk=30");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to load events");
        return;
      }
      setEvents(data.events ?? []);
      setError(null);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const runAction = async (
    action: "flag" | "block" | "shadow_ban_device",
    payload: { userId?: string; deviceFingerprint?: string; reason?: string }
  ) => {
    const key = `${action}-${payload.userId ?? payload.deviceFingerprint}`;
    setActing(key);
    try {
      const res = await fetch("/api/admin/security/suspicious-activity/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Action failed");
        return;
      }
      fetchEvents();
    } finally {
      setActing(null);
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      });
    } catch {
      return s;
    }
  };

  const riskLabel = (score: number) => {
    if (score <= 30) return "Normal";
    if (score <= 60) return "Suspicious";
    return "High risk";
  };

  const riskColor = (score: number) => {
    if (score <= 30) return "text-white/70";
    if (score <= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Suspicious Activity</h2>
        <p className="mt-1 text-xs text-white/55">
          Auth events with risk score ≥ 30. Flag accounts, block users, or shadow ban devices.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        {loading && <p className="text-sm text-white/60">Loading…</p>}
        {error && (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 text-white/70">
                  <th className="pb-2 pr-4 font-medium">Time</th>
                  <th className="pb-2 pr-4 font-medium">User / Email</th>
                  <th className="pb-2 pr-4 font-medium">IP</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Risk</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white/85">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-white/50">
                      No suspicious events (risk ≥ 30) yet.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-white/8 hover:bg-white/5"
                    >
                      <td className="py-2 pr-4 text-white/70">
                        {formatDate(e.created_at)}
                      </td>
                      <td className="py-2 pr-4">
                        {e.email ?? (e.user_id ? `User ${e.user_id.slice(0, 8)}…` : "—")}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {e.ip_address}
                      </td>
                      <td className="py-2 pr-4 capitalize">
                        {e.event_type.replace(/_/g, " ")}
                      </td>
                      <td className={`py-2 pr-4 font-medium ${riskColor(e.risk_score)}`}>
                        {e.risk_score} ({riskLabel(e.risk_score)})
                      </td>
                      <td className="py-2 flex flex-wrap gap-1">
                        {e.user_id && (
                          <>
                            <Button
                              size="md"
                              variant="ghost"
                              className="h-7 text-xs border border-white/20"
                              disabled={!!acting}
                              onClick={() =>
                                runAction("flag", {
                                  userId: e.user_id!,
                                  reason: "Suspicious activity",
                                })
                              }
                            >
                              Flag
                            </Button>
                            <Button
                              size="md"
                              variant="ghost"
                              className="h-7 text-xs text-rose-400 border border-rose-400/50"
                              disabled={!!acting}
                              onClick={() =>
                                runAction("block", {
                                  userId: e.user_id!,
                                  reason: "Suspicious activity",
                                })
                              }
                            >
                              Block
                            </Button>
                          </>
                        )}
                        {e.device_fingerprint && (
                          <Button
                            size="md"
                            variant="ghost"
                            className="h-7 text-xs text-amber-400 border border-amber-400/50"
                            disabled={!!acting}
                            onClick={() =>
                              runAction("shadow_ban_device", {
                                deviceFingerprint: e.device_fingerprint!,
                                reason: "Suspicious activity",
                              })
                            }
                          >
                            Shadow ban device
                          </Button>
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
