"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const agentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is required"),
  personality: z.string().min(4, "Personality description is required"),
  system_prompt: z.string().min(10, "System prompt is required"),
  avatar: z.string().optional(),
  active: z.boolean().default(true),
});

type AgentFormValues = {
  id?: string;
  name: string;
  personality: string;
  system_prompt: string;
  avatar?: string;
  active: boolean;
};

type AgentRecord = {
  id: string;
  name: string;
  personality: string | null;
  system_prompt: string;
  avatar: string | null;
  active: boolean;
  created_at: string;
};

export function AdminAgentManager() {
  const [agents, setAgents] = React.useState<AgentRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<AgentRecord | null>(null);

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema) as Resolver<AgentFormValues>,
    defaultValues: {
      name: "",
      personality: "",
      system_prompt: "",
      avatar: "",
      active: true,
    },
  });

  React.useEffect(() => {
    void loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agents");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load agents (${res.status})`);
      }
      const data = (await res.json()) as { agents: AgentRecord[] };
      setAgents(data.agents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditing(null);
    form.reset({
      name: "",
      personality: "",
      system_prompt: "",
      avatar: "",
      active: true,
    });
  }

  function startEdit(agent: AgentRecord) {
    setEditing(agent);
    form.reset({
      id: agent.id,
      name: agent.name,
      personality: agent.personality ?? "",
      system_prompt: agent.system_prompt,
      avatar: agent.avatar ?? "",
      active: agent.active,
    });
  }

  async function onSubmit(values: AgentFormValues) {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: values.name,
        personality: values.personality,
        system_prompt: values.system_prompt,
        avatar: values.avatar || null,
        active: values.active,
      };

      let res: Response;
      if (values.id) {
        res = await fetch(`/api/admin/agents/${values.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Save failed (${res.status})`);
      }

      await loadAgents();
      startCreate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save agent");
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result?.toString() ?? "";
      form.setValue("avatar", dataUrl, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  }

  const currentAvatar = form.watch("avatar");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]">
      <GlassPanel className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Council agents
            </h3>
            <p className="mt-1 text-[11px] text-white/50">
              Toggle availability and refine personalities.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={startCreate}
          >
            New agent
          </Button>
        </div>

        <div className="relative mt-2 max-h-[320px] space-y-2 overflow-y-auto pr-2">
          <AnimatePresence initial={false}>
            {loading ? (
              <div className="py-12 text-center text-xs text-white/50">
                Loading agents…
              </div>
            ) : agents.length === 0 ? (
              <div className="py-12 text-center text-xs text-white/50">
                No agents yet. Use the form to create your first council
                member.
              </div>
            ) : (
              agents.map((agent) => (
                <motion.button
                  key={agent.id}
                  type="button"
                  layout
                  onClick={() => startEdit(agent)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/80 shadow-soft backdrop-blur-xl transition",
                    editing?.id === agent.id
                      ? "border-white/40 bg-white/15"
                      : "hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-2xl bg-white/10 flex items-center justify-center text-[11px] font-semibold">
                      {(agent.name || "?")
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold">
                        {agent.name}
                      </div>
                      <div className="line-clamp-1 text-[11px] text-white/55">
                        {agent.personality}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-[3px] uppercase tracking-wide",
                        agent.active
                          ? "bg-emerald-400/15 text-emerald-100 border border-emerald-400/40"
                          : "bg-white/5 text-white/60 border border-white/15"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          agent.active ? "bg-emerald-300" : "bg-white/40"
                        )}
                      />
                      {agent.active ? "Active" : "Disabled"}
                    </span>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </GlassPanel>

      <GlassPanel className="p-5">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {editing ? "Edit agent" : "New agent"}
              </h3>
              <p className="mt-1 text-[11px] text-white/55">
                Configure the agent&apos;s tone and behavior. Changes apply
                immediately.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-white/60">Name</label>
              <Input
                {...form.register("name")}
                placeholder="e.g. Nova"
                className="h-9 rounded-2xl border-white/15 bg-white/5 text-xs"
              />
              {form.formState.errors.name?.message && (
                <p className="text-[11px] text-rose-300">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">
                Personality description
              </label>
              <Input
                {...form.register("personality")}
                placeholder="e.g. Creative thinker focused on novel angles"
                className="h-9 rounded-2xl border-white/15 bg-white/5 text-xs"
              />
              {form.formState.errors.personality?.message && (
                <p className="text-[11px] text-rose-300">
                  {form.formState.errors.personality.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60">System prompt</label>
              <Textarea
                {...form.register("system_prompt")}
                placeholder="Describe how this agent should think, speak, and behave…"
                className="min-h-[120px] rounded-2xl border-white/15 bg-white/5 text-xs"
              />
              {form.formState.errors.system_prompt?.message && (
                <p className="text-[11px] text-rose-300">
                  {form.formState.errors.system_prompt.message}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
              <div className="space-y-1">
                <label className="text-[11px] text-white/60">
                  Avatar upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full cursor-pointer rounded-2xl border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-white/70 file:mr-2 file:rounded-xl file:border-0 file:bg-white/90 file:px-2 file:py-1 file:text-[11px] file:font-medium file:text-black"
                />
                <p className="mt-1 text-[10px] text-white/40">
                  Stored as a data URL in the database. For production, switch
                  to object storage.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-white/60">Preview</label>
                <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-2">
                  <div className="h-9 w-9 overflow-hidden rounded-2xl bg-white/10 flex items-center justify-center text-[11px] font-semibold">
                    {currentAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentAvatar}
                        alt="avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (form.watch("name") || "?")
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                    )}
                  </div>
                  <div className="text-[11px] text-white/55">
                    {currentAvatar ? "Custom avatar loaded" : "No avatar set"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-[11px] text-white/65">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/40 bg-black/40"
                  checked={form.watch("active")}
                  onChange={(e) => form.setValue("active", e.target.checked)}
                />
                Active
                <span className="text-white/40">
                  (disabled agents won&apos;t be selected in councils)
                </span>
              </label>

              <Button
                type="submit"
                size="md"
                disabled={saving}
                className="text-xs"
              >
                {saving
                  ? "Saving…"
                  : editing
                  ? "Save changes"
                  : "Create agent"}
              </Button>
            </div>
          </div>

          {error ? (
            <p className="mt-1 text-[11px] text-rose-300">{error}</p>
          ) : null}
        </form>
      </GlassPanel>
    </div>
  );
}

