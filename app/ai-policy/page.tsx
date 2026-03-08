import { GlassPanel } from "@/components/glass-panel";
import { GalaxyPageWrapper } from "@/components/GalaxyPageWrapper";

export default function AiPolicyPage() {
  return (
    <GalaxyPageWrapper>
    <div className="min-h-dvh px-4 pb-20 pt-16 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassPanel className="p-6 md:p-8 border-white/20 bg-black/60">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">
            AI Usage Disclosure
          </h1>
          <p className="mt-2 text-sm text-white/60">
            This AI Usage Disclosure explains how Circle uses AI technologies,
            how AI-generated content is produced, and what limitations apply.
          </p>
        </GlassPanel>

        <GlassPanel className="p-6 md:p-7 border-white/15 bg-black/50 text-sm text-white/80 space-y-4">
          <section>
            <h2 className="text-base font-semibold text-white">
              1. AI-generated content
            </h2>
            <p className="mt-1 text-white/70">
              Circle uses multiple AI agents to generate ideas, critiques, and
              recommendations in response to your prompts. These outputs are
              created by machine learning models and may not always be accurate,
              complete, or up to date.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              2. Data sent to AI providers
            </h2>
            <p className="mt-1 text-white/70">
              When you use Circle, parts of your input and conversation history
              may be sent to third-party AI providers (such as DeepSeek) to
              generate responses. We aim to minimize identifiable information
              and to respect your privacy preferences as described in the
              Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              3. Human review
            </h2>
            <p className="mt-1 text-white/70">
              In limited cases, anonymized or aggregated interaction data may be
              reviewed by humans to monitor system quality, investigate abuse,
              or improve the product. We do not use your personal identity to
              market to you based on AI outputs without your consent.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              4. Limitations and responsibility
            </h2>
            <p className="mt-1 text-white/70">
              AI outputs can be plausible but wrong, biased, or inconsistent.
              You should not rely on Circle for decisions that could cause harm
              without additional human review. You are responsible for verifying
              critical information and for how you act on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              5. Safety and feedback
            </h2>
            <p className="mt-1 text-white/70">
              We continuously work to improve safety by tuning prompts, adding
              constraints, and monitoring for abuse. If you encounter harmful,
              unsafe, or inappropriate outputs, please discontinue use of that
              conversation and report the issue so we can investigate.
            </p>
          </section>
        </GlassPanel>
      </div>
    </div>
    </GalaxyPageWrapper>
  );
}

