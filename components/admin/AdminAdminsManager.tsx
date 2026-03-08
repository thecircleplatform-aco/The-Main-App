"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const addAdminSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be 8+ characters"),
  role: z.enum(["owner", "admin", "viewer"]),
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;

type AdminRecord = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

type Props = {
  admins: AdminRecord[];
  currentAdminEmail: string;
  canManageAdmins: boolean;
};

export function AdminAdminsManager({
  admins: initialAdmins,
  currentAdminEmail,
  canManageAdmins,
}: Props) {
  const [admins, setAdmins] = React.useState(initialAdmins);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<AddAdminFormValues>({
    resolver: zodResolver(addAdminSchema) as Resolver<AddAdminFormValues>,
    defaultValues: {
      email: "",
      password: "",
      role: "admin",
    },
  });

  async function loadAdmins() {
    try {
      const res = await fetch("/api/admin/admins");
      if (res.ok) {
        const data = (await res.json()) as { admins: AdminRecord[] };
        setAdmins(data.admins);
      }
    } catch {
      // Ignore
    }
  }

  async function onSubmit(values: AddAdminFormValues) {
    if (!canManageAdmins) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add admin");
        return;
      }
      await loadAdmins();
      form.reset({ email: "", password: "", role: "admin" });
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function removeAdmin(id: string) {
    if (!canManageAdmins) return;
    if (!confirm("Remove this admin? They will lose admin access.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to remove admin");
        return;
      }
      await loadAdmins();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]">
      <GlassPanel className="p-5">
        <h3 className="text-sm font-semibold text-white">Admin users</h3>
        <p className="mt-1 text-[11px] text-white/50">
          Users with access to the admin panel. Owners can manage other admins.
        </p>

        <div className="mt-3 max-h-[400px] space-y-2 overflow-y-auto pr-2">
          {admins.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 shadow-soft backdrop-blur-xl",
                a.email.toLowerCase() === currentAdminEmail.toLowerCase() &&
                  "border-emerald-400/30 bg-emerald-400/10"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/10 text-[11px] font-semibold">
                  {a.email
                    .split("@")[0]
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{a.email}</div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-[3px] text-[10px] uppercase tracking-wide",
                        a.role === "owner"
                          ? "bg-amber-400/20 text-amber-200 border border-amber-400/40"
                          : a.role === "admin"
                          ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/40"
                          : "bg-white/10 text-white/60 border border-white/20"
                      )}
                    >
                      {a.role}
                    </span>
                    {a.email.toLowerCase() === currentAdminEmail.toLowerCase() && (
                      <span className="text-[10px] text-white/45">(you)</span>
                    )}
                  </div>
                </div>
              </div>
              {canManageAdmins &&
                a.role !== "owner" &&
                a.email.toLowerCase() !== currentAdminEmail.toLowerCase() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => removeAdmin(a.id)}
                    disabled={loading}
                    className="text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    Remove
                  </Button>
                )}
            </div>
          ))}
        </div>
      </GlassPanel>

      {canManageAdmins && (
        <GlassPanel className="p-5">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 text-xs"
          >
            <h3 className="text-sm font-semibold text-white">Add admin</h3>
            <p className="text-[11px] text-white/55">
              Create a user account with admin access. They can sign in with
              this email and password.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Email</label>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="admin@example.com"
                className="h-9 rounded-2xl border-white/15 bg-white/5 text-xs"
              />
              {form.formState.errors.email?.message && (
                <p className="text-[11px] text-rose-300">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Password</label>
              <Input
                {...form.register("password")}
                type="password"
                placeholder="••••••••"
                className="h-9 rounded-2xl border-white/15 bg-white/5 text-xs"
              />
              {form.formState.errors.password?.message && (
                <p className="text-[11px] text-rose-300">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Role</label>
              <select
                {...form.register("role")}
                className="h-9 w-full rounded-2xl border border-white/15 bg-white/5 px-3 text-xs text-white/90 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="admin">Admin (manage content)</option>
                <option value="owner">Owner (manage admins)</option>
              </select>
            </div>

            <Button
              type="submit"
              size="md"
              disabled={loading}
              className="text-xs"
            >
              {loading ? "Adding…" : "Add admin"}
            </Button>

            {error && (
              <p className="text-[11px] text-rose-300">{error}</p>
            )}
          </form>
        </GlassPanel>
      )}

      {!canManageAdmins && (
        <GlassPanel className="p-5">
          <p className="text-xs text-white/60">
            Only owners can add or remove admins. Ask an owner to upgrade your
            role.
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
