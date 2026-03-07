"use client";

import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlassPanel } from "@/components/glass-panel";
import { useCouncil } from "@/hooks/useCouncil";
import { cn } from "@/lib/utils";

const schema = z.object({
  idea: z.string().min(10, "Tell the council a bit more (min 10 chars)."),
});

type FormValues = z.infer<typeof schema>;

const accentRing: Record<string, string> = {
  cyan: "ring-cyan-400/25",
  violet: "ring-violet-400/25",
  amber: "ring-amber-400/25",
  emerald: "ring-emerald-400/25",
  rose: "ring-rose-400/25",
};

export function CouncilChat() {
  const council = useCouncil();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { idea: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await council.run(values.idea);
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-white/80 shadow-soft backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-white/70" />
            AI Council Platform
          </div>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Circle
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-white/60">
            Share an idea. Multiple AI personalities will discuss it, challenge
            it, and propose an execution plan.
          </p>
        </div>
        <div className="hidden md:block">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/60 shadow-soft backdrop-blur-2xl">
            Dark-first glass UI
            <div className="mt-1 text-white/40">Smooth • Responsive • SaaS</div>
          </div>
        </div>
      </div>

      <GlassPanel className="p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <Textarea
            placeholder="Describe your idea… who it’s for, what problem it solves, and what success looks like."
            {...form.register("idea")}
          />
          {form.formState.errors.idea?.message ? (
            <p className="text-sm text-rose-300/90">
              {form.formState.errors.idea.message}
            </p>
          ) : null}
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              disabled={council.status === "running"}
              className="w-full sm:w-auto"
            >
              <Wand2 className="h-4 w-4" />
              {council.status === "running" ? "Council is thinking…" : "Run council"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                form.reset();
                council.reset();
              }}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
          </div>
          {council.error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {council.error}
            </div>
          ) : null}
        </form>
      </GlassPanel>

      <div className="mt-10 space-y-4">
        {council.messages.map((m, idx) => {
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2) }}
            >
              <GlassPanel
                className={cn(
                  "p-5 md:p-6",
                  m.role === "assistant" ? "ring-1 " + (accentRing[m.personaId ?? ""] ?? "ring-white/10") : "ring-1 ring-white/10"
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white/80">
                    {m.role === "user" ? "You" : m.personaName ?? "Council"}
                  </div>
                  <div className="text-xs text-white/40">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="prose prose-invert max-w-none text-white/70">
                  {m.content.split("\n").map((line, i) => (
                    <p key={i} className="my-0 whitespace-pre-wrap leading-7">
                      {line}
                    </p>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

