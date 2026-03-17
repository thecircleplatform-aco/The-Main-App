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
import { ACO_ROLES } from "@/auth/constants/acoRoles";

const createSchema = z.object({
  code: z.string().min(1, "Code is required").max(80),
  role: z.enum(["user", "tester", "developer", "partner"]),
  uses_limit: z.coerce.number().int().min(0),
  expires_at: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

export type AcoCodeRecord = {
  id: string;
  code: string;
  role: string;
  uses_limit: number;
  uses_count: number;
  expires_at: string | null;
  disabled: boolean;
  created_by: string | null;
  created_at: string;
};

type Props = {
  canEdit: boolean;
};

export function AdminAcoCodesManager({ canEdit }: Props) {
  const [codes, setCodes] = React.useState<AcoCodeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const editForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema) as Resolver<CreateFormValues>,
    defaultValues: { code: "", role: "user", uses_limit: 0, expires_at: "" },
  });

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema) as Resolver<CreateFormValues>,
    defaultValues: {
      code: "",
      role: "user",
      uses_limit: 0,
      expires_at: "",
    },
  });

  async function loadCodes() {
    try {
      const res = await fetch("/api/admin/aco-codes");
      if (res.ok) {
        const data = (await res.json()) as { codes: AcoCodeRecord[] };
        setCodes(data.codes ?? []);
      }
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadCodes();
  }, []);

  async function onSubmit(values: CreateFormValues) {
    if (!canEdit) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/aco-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: values.code.trim(),
          role: values.role,
          uses_limit: values.uses_limit,
          expires_at: values.expires_at?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create code");
        return;
      }
      await loadCodes();
      form.reset({ code: "", role: "user", uses_limit: 0, expires_at: "" });
    } catch {
      setError("Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleDisabled(rec: AcoCodeRecord) {
    if (!canEdit) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/aco-codes/${rec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !rec.disabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update");
        return;
      }
      await loadCodes();
      setEditingId(null);
    } catch {
      setError("Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteCode(id: string) {
    if (!canEdit) return;
    if (!confirm("Delete this access code? This cannot be undone.")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/aco-codes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete");
        return;
      }
      await loadCodes();
      setEditingId(null);
    } catch {
      setError("Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  }

  function startEdit(rec: AcoCodeRecord) {
    setEditingId(rec.id);
    setError(null);
    editForm.reset({
      code: rec.code,
      role: rec.role as CreateFormValues["role"],
      uses_limit: rec.uses_limit,
      expires_at: rec.expires_at ? rec.expires_at.slice(0, 16) : "",
    });
  }

  async function saveEdit(id: string) {
    const values = editForm.getValues();
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/aco-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: values.code.trim(),
          role: values.role,
          uses_limit: values.uses_limit,
          expires_at: values.expires_at?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
        return;
      }
      await loadCodes();
      setEditingId(null);
    } catch {
      setError("Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(s: string | null) {
    if (!s) return "—";
    try {
      const d = new Date(s);
      return d.toLocaleDateString(undefined, { dateStyle: "short" });
    } catch {
      return s;
    }
  }

  if (loading) {
    return (
      <GlassPanel className="p-5">
        <p className="text-xs text-white/60">Loading access codes…</p>
      </GlassPanel>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
      <GlassPanel className="p-5">
        <h3 className="text-sm font-semibold text-white">Access codes</h3>
        <p className="mt-1 text-[11px] text-white/50">
          Invitation codes for testers, developers, and partners. Users enter a code at signup to get the assigned role.
        </p>

        <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-2">
          {codes.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center text-xs text-white/50">
              No access codes yet. Create one with the form on the right.
            </p>
          ) : (
            codes.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 shadow-soft backdrop-blur-xl",
                  c.disabled && "opacity-60"
                )}
              >
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/50">Code</label>
                        <Input
                          {...editForm.register("code")}
                          className="h-8 rounded-xl border-white/15 bg-white/5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50">Role</label>
                        <select
                          {...editForm.register("role")}
                          className="h-8 w-full rounded-xl border border-white/15 bg-white/5 px-2 text-xs text-white/90"
                        >
                          {ACO_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/50">Usage limit</label>
                        <Input
                          {...editForm.register("uses_limit")}
                          type="number"
                          min={0}
                          className="h-8 rounded-xl border-white/15 bg-white/5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50">Expires</label>
                        <Input
                          {...editForm.register("expires_at")}
                          type="datetime-local"
                          className="h-8 rounded-xl border-white/15 bg-white/5 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="md"
                        onClick={() => saveEdit(c.id)}
                        disabled={actionLoading}
                        className="text-[11px]"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={() => setEditingId(null)}
                        className="text-[11px] text-white/60"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{c.code}</span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-[3px] text-[10px] uppercase",
                          c.role === "partner"
                            ? "bg-amber-400/20 text-amber-200"
                            : c.role === "developer"
                            ? "bg-blue-400/20 text-blue-200"
                            : c.role === "tester"
                            ? "bg-emerald-400/20 text-emerald-200"
                            : "bg-white/10 text-white/60"
                        )}
                      >
                        {c.role}
                      </span>
                      {c.disabled && (
                        <span className="rounded-full bg-rose-500/20 px-2 py-[3px] text-[10px] text-rose-300">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/55">
                        {c.uses_count} / {c.uses_limit === 0 ? "∞" : c.uses_limit}
                      </span>
                      <span className="text-white/45">{formatDate(c.expires_at)}</span>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={() => startEdit(c)}
                            disabled={actionLoading}
                            className="text-[11px] text-white/70 hover:text-white"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={() => toggleDisabled(c)}
                            disabled={actionLoading}
                            className="text-[11px] text-white/70 hover:text-white"
                          >
                            {c.disabled ? "Enable" : "Disable"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={() => deleteCode(c.id)}
                            disabled={actionLoading}
                            className="text-[11px] text-rose-400 hover:text-rose-300"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {error && (
          <p className="mt-2 text-[11px] text-rose-300">{error}</p>
        )}
      </GlassPanel>

      {canEdit && (
        <GlassPanel className="p-5">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 text-xs"
          >
            <h3 className="text-sm font-semibold text-white">Create code</h3>
            <p className="text-[11px] text-white/55">
              Set role, usage limit (0 = unlimited), and optional expiration.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Code</label>
              <Input
                {...form.register("code")}
                placeholder="e.g. BETA-2025"
                className="h-9 rounded-2xl border-white/15 bg-white/5 text-xs"
              />
              {form.formState.errors.code?.message && (
                <p className="text-[11px] text-rose-300">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Role</label>
              <select
                {...form.register("role")}
                className="h-9 w-full rounded-2xl border border-white/15 bg-white/5 px-3 text-xs text-white/90 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                {ACO_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Usage limit (0 = unlimited)</label>
              <Input
                {...form.register("uses_limit")}
                type="number"
                min={0}
                className="h-9 rounded-2xl border-white/15 bg-white/5 text-xs"
              />
              {form.formState.errors.uses_limit?.message && (
                <p className="text-[11px] text-rose-300">
                  {form.formState.errors.uses_limit.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Expires at (optional, ISO)</label>
              <Input
                {...form.register("expires_at")}
                type="datetime-local"
                className="h-9 rounded-2xl border-white/15 bg-white/5 text-xs"
              />
            </div>

            <Button
              type="submit"
              size="md"
              disabled={actionLoading}
              className="text-xs"
            >
              {actionLoading ? "Creating…" : "Create code"}
            </Button>
          </form>
        </GlassPanel>
      )}

      {!canEdit && (
        <GlassPanel className="p-5">
          <p className="text-xs text-white/60">
            Only admins and owners can create or edit access codes.
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
