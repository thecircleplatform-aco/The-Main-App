"use client";

import * as React from "react";
import { GlassPanel } from "@/components/glass-panel";

type Attempt = {
  id: string;
  ip_address: string;
  email: string;
  success: boolean;
  action: string;
  created_at: string;
};

export default function AdminLoginAttemptsPage() {
  const [attempts, setAttempts] = React.useState<Attempt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/security/login-attempts?limit=200");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Failed to load login attempts");
          return;
        }
        if (!cancelled) setAttempts(data.attempts ?? []);
      } catch (e) {
        if (!cancelled) setError("Request failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
      });
    } catch {
      return s;
    }
  };

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Login Attempts</h2>
        <p className="mt-1 text-xs text-white/55">
          Recent login and registration attempts for security monitoring and
          brute-force analysis. Failed attempts are rate-limited per IP.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        {loading && (
          <p className="text-sm text-white/60">Loading…</p>
        )}
        {error && (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 text-white/70">
                  <th className="pb-2 pr-4 font-medium">Time (UTC)</th>
                  <th className="pb-2 pr-4 font-medium">IP</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Action</th>
                  <th className="pb-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="text-white/85">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-white/50">
                      No login attempts recorded yet.
                    </td>
                  </tr>
                ) : (
                  attempts.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-white/8 hover:bg-white/5"
                    >
                      <td className="py-2 pr-4 text-white/70">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {a.ip_address}
                      </td>
                      <td className="py-2 pr-4">{a.email}</td>
                      <td className="py-2 pr-4 capitalize">{a.action}</td>
                      <td className="py-2">
                        {a.success ? (
                          <span className="text-emerald-400">Success</span>
                        ) : (
                          <span className="text-rose-400">Failed</span>
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
