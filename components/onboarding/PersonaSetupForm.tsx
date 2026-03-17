"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GlassPanel } from "@/components/glass-panel";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSelect } from "@/components/ui/glass-select";
import { Textarea } from "@/components/ui/textarea";
import { InterestSelector, type InterestValue } from "./InterestSelector";
import { COUNTRIES } from "@/config/countries";
import { softSpring, panelFade } from "@/lib/animations";
import { cn } from "@/lib/utils";

const AI_PERSONALITY_OPTIONS = [
  { value: "Supportive", label: "Supportive" },
  { value: "Strategic", label: "Strategic" },
  { value: "Creative", label: "Creative" },
  { value: "Analytical", label: "Analytical" },
] as const;

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not", label: "Prefer not to say" },
] as const;

const TOTAL_STEPS = 2;

export function PersonaSetupForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [flying, setFlying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [nickname, setNickname] = React.useState("");
  const [interests, setInterests] = React.useState<InterestValue[]>([]);
  const [goals, setGoals] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [aiPersonality, setAiPersonality] = React.useState("Supportive");
  const [ideaSharingEnabled, setIdeaSharingEnabled] = React.useState(false);

  const canProceedStep1 =
    nickname.trim().length > 0 && interests.length > 0;

  const handleNext = () => {
    setError(null);
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = React.useCallback(() => {
    router.push("/");
    router.refresh();
  }, [router]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/persona/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          interests,
          goals: goals.trim() || undefined,
          ai_personality: aiPersonality,
          idea_sharing_enabled: ideaSharingEnabled,
          gender: gender || undefined,
          birth_date: birthDate || undefined,
          country: country || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setFlying(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <AnimatePresence mode="wait">
        {!flying && (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <GlassPanel className="overflow-hidden p-6 shadow-xl sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Your AI Persona
                </h1>
                <span
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-white/10 dark:text-white/80"
                  aria-live="polite"
                >
                  Step {step} of {TOTAL_STEPS}
                </span>
              </div>

              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gray-600 dark:bg-white/30"
                  initial={false}
                  animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                  transition={softSpring}
                />
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={panelFade}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={softSpring}
                    className="space-y-5 pt-4"
                  >
                    <div>
                      <label
                        htmlFor="persona-nickname"
                        className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                      >
                        Nickname <span className="text-rose-400">*</span>
                      </label>
                      <GlassInput
                        id="persona-nickname"
                        type="text"
                        placeholder="How you'll appear in Circle"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        maxLength={64}
                        autoComplete="nickname"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="persona-gender"
                          className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                        >
                          Gender
                        </label>
                        <GlassSelect
                          id="persona-gender"
                          value={gender}
                          onChange={setGender}
                          options={GENDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                          placeholder="Select…"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="persona-birthday"
                          className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                        >
                          Birthday
                        </label>
                        <GlassInput
                          id="persona-birthday"
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="persona-country"
                        className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                      >
                        Country
                      </label>
                      <GlassSelect
                        id="persona-country"
                        value={country}
                        onChange={setCountry}
                        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                        placeholder="Select…"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70">
                        Main interests <span className="text-rose-400">*</span>
                      </label>
                      <p className="mb-2 text-xs text-gray-500 dark:text-white/50">
                        Select at least one to personalize your assistant.
                      </p>
                      <InterestSelector value={interests} onChange={setInterests} />
                    </div>

                    <div>
                      <label
                        htmlFor="persona-goals"
                        className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70"
                      >
                        Main goals
                      </label>
                      <Textarea
                        id="persona-goals"
                        placeholder="e.g. Build startups, Improve mental health, Learn programming"
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        rows={3}
                        className="rounded-2xl border-gray-200 bg-gray-50 backdrop-blur-xl placeholder:text-gray-400 dark:border-white/20 dark:bg-white/6 dark:placeholder:text-white/40"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <GlassButton
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceedStep1}
                      >
                        Next
                      </GlassButton>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={panelFade}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={softSpring}
                    className="space-y-5 pt-4"
                  >
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-white/70">
                        Preferred AI personality
                      </label>
                      <div className="space-y-2">
                        {AI_PERSONALITY_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                              aiPersonality === opt.value
                                ? "border-gray-300 bg-gray-200 dark:border-white/25 dark:bg-white/10"
                                : "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.07]"
                            )}
                          >
                            <input
                              type="radio"
                              name="ai-personality"
                              value={opt.value}
                              checked={aiPersonality === opt.value}
                              onChange={() => setAiPersonality(opt.value)}
                              className="h-4 w-4 border-gray-300 bg-gray-100 text-gray-900 focus:ring-gray-400 dark:border-white/30 dark:bg-white/5 dark:text-white dark:focus:ring-white/25"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Share ideas in the Circle Idea Bank
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
                            Allow my ideas to be shared anonymously in the Circle
                            Idea Bank.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={ideaSharingEnabled}
                          onClick={() => setIdeaSharingEnabled((v) => !v)}
                          className={cn(
                            "relative h-7 w-12 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-white/25",
                            ideaSharingEnabled
                              ? "border-gray-400 bg-gray-300 dark:border-white/30 dark:bg-white/20"
                              : "border-gray-200 bg-gray-100 dark:border-white/15 dark:bg-white/5"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-white",
                              ideaSharingEnabled && "translate-x-5"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-rose-400" role="alert">
                        {error}
                      </p>
                    )}

                    <div className="flex justify-between gap-3 pt-2">
                      <GlassButton type="button" variant="ghost" onClick={handleBack}>
                        Back
                      </GlassButton>
                      <GlassButton
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? "Creating…" : "Finish"}
                      </GlassButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
