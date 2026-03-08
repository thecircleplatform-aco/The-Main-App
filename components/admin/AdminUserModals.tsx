"use client";

import * as React from "react";
import { GlassPanel } from "@/components/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRow } from "./UserContextMenu";

type EditUserModalProps = {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
  mode: "username" | "email" | "password";
  onSubmit: (userId: string, field: "username" | "email" | "password", value: string) => Promise<void>;
};

function EditUserModal({
  open,
  onClose,
  user,
  mode,
  onSubmit,
}: EditUserModalProps) {
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && user) {
      setValue(
        mode === "username"
          ? user.name ?? ""
          : mode === "email"
            ? user.email
            : ""
      );
      setError(null);
    }
  }, [open, user, mode]);

  if (!open) return null;

  const labels = {
    username: { title: "Change username", placeholder: "Display name", field: "username" },
    email: { title: "Change email", placeholder: "Email address", field: "email" },
    password: { title: "Reset password", placeholder: "New password (min 8 chars)", field: "password" },
  };
  const { title, placeholder } = labels[mode];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      await onSubmit(user.id, mode, value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <GlassPanel className="relative w-full max-w-md p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/60">
          {user?.email} • {user?.name ?? "—"}
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/70">
              {placeholder}
            </label>
            <Input
              type={mode === "password" ? "password" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              required
              disabled={loading}
              minLength={mode === "password" ? 8 : undefined}
            />
          </div>
          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
};

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
}: ConfirmModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <GlassPanel className="relative w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/70">{message}</p>
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "flex-1",
              variant === "danger" && "bg-rose-500/30 text-rose-300 hover:bg-rose-500/40"
            )}
          >
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}

type IpHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
  ips: { ip_address: string; device_id: string | null; created_at: string }[];
  loading: boolean;
};

function IpHistoryModal({
  open,
  onClose,
  user,
  ips,
  loading,
}: IpHistoryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <GlassPanel className="relative max-h-[80vh] w-full max-w-lg overflow-hidden p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">IP History</h3>
        <p className="mt-1 text-sm text-white/60">
          {user?.email} • {user?.name ?? "—"}
        </p>
        <div className="mt-4 max-h-[300px] overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-white/50">Loading…</p>
          ) : ips.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">No IP records</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-white/60">
                  <th className="py-2">IP</th>
                  <th className="py-2">Device</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {ips.map((r, i) => (
                  <tr key={i} className="border-t border-white/8">
                    <td className="py-2 font-mono text-white/80">{r.ip_address}</td>
                    <td className="py-2 text-white/60">{r.device_id ?? "—"}</td>
                    <td className="py-2 text-white/55">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

type ActivityModalProps = {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
  activity: {
    sessions: { id: string; created_at: string }[];
    ipHistory: { ip_address: string; device_id: string | null; created_at: string }[];
    supportTickets: { id: string; message: string; status: string; created_at: string }[];
  } | null;
  loading: boolean;
};

function ActivityModal({
  open,
  onClose,
  user,
  activity,
  loading,
}: ActivityModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <GlassPanel className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">Account Activity</h3>
        <p className="mt-1 text-sm text-white/60">
          {user?.email} • {user?.name ?? "—"}
        </p>
        <div className="mt-4 max-h-[400px] space-y-4 overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-white/50">Loading…</p>
          ) : !activity ? (
            <p className="py-8 text-center text-sm text-white/50">No data</p>
          ) : (
            <>
              <section>
                <h4 className="text-sm font-medium text-white/80">Recent sessions</h4>
                <ul className="mt-1 space-y-1 text-xs text-white/60">
                  {activity.sessions.length === 0 ? (
                    <li>None</li>
                  ) : (
                    activity.sessions.slice(0, 10).map((s) => (
                      <li key={s.id}>
                        {new Date(s.created_at).toLocaleString()}
                      </li>
                    ))
                  )}
                </ul>
              </section>
              <section>
                <h4 className="text-sm font-medium text-white/80">IP history</h4>
                <ul className="mt-1 space-y-1 text-xs text-white/60">
                  {activity.ipHistory.length === 0 ? (
                    <li>None</li>
                  ) : (
                    activity.ipHistory.slice(0, 10).map((r, i) => (
                      <li key={i}>
                        {r.ip_address} • {new Date(r.created_at).toLocaleString()}
                      </li>
                    ))
                  )}
                </ul>
              </section>
              <section>
                <h4 className="text-sm font-medium text-white/80">Support tickets</h4>
                <ul className="mt-1 space-y-1 text-xs text-white/60">
                  {activity.supportTickets.length === 0 ? (
                    <li>None</li>
                  ) : (
                    activity.supportTickets.map((t) => (
                      <li key={t.id}>
                        <span className="capitalize">{t.status}</span> •{" "}
                        {t.message.slice(0, 60)}… • {new Date(t.created_at).toLocaleString()}
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

export {
  EditUserModal,
  ConfirmModal,
  IpHistoryModal,
  ActivityModal,
};
