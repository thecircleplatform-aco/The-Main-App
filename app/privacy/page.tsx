import { GlassPanel } from "@/components/glass-panel";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh px-4 pb-20 pt-16 md:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassPanel className="p-6 md:p-8 border-white/20 bg-black/60">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-white/60">
            This Privacy Policy explains how Circle collects, uses, and protects
            information when you use the Circle AI council platform.
          </p>
        </GlassPanel>

        <GlassPanel className="p-6 md:p-7 border-white/15 bg-black/50 text-sm text-white/80 space-y-4">
          <section>
            <h2 className="text-base font-semibold text-white">
              1. Information we collect
            </h2>
            <p className="mt-1 text-white/70">
              Circle may collect account details (such as email and display
              name), usage data (such as sessions, messages, and insights
              generated), and technical data (such as browser and device
              information) in order to operate and improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              2. How we use your information
            </h2>
            <p className="mt-1 text-white/70">
              We use your information to provide and personalize the AI council
              experience, maintain platform security, and analyze aggregated,
              anonymized usage patterns to improve Circle. When you opt in, your
              ideas and discussions may be used to refine AI models in a way
              that does not directly identify you.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              3. Data retention and controls
            </h2>
            <p className="mt-1 text-white/70">
              Conversation history and derived insights are retained according
              to your configured data retention settings where available, or for
              as long as necessary to provide the service. You can request data
              export or deletion through the settings or by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              4. Sharing of information
            </h2>
            <p className="mt-1 text-white/70">
              We do not sell your personal information. We may share limited
              data with infrastructure and analytics providers under contract
              who process data on our behalf and are required to protect it. We
              may also disclose information if required by law or to protect the
              rights, safety, or security of users and the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              5. Third-party AI providers
            </h2>
            <p className="mt-1 text-white/70">
              Circle uses third-party AI providers (such as DeepSeek) to
              generate responses. Your prompts and model outputs may pass
              through these providers in accordance with their terms and
              privacy policies. We aim to minimize the identifiable data sent to
              such providers and to respect your privacy preferences.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">
              6. Changes to this policy
            </h2>
            <p className="mt-1 text-white/70">
              We may update this Privacy Policy from time to time. Material
              changes will be communicated via the product or by email where
              appropriate. Continued use of Circle after changes become
              effective constitutes acceptance of the revised policy.
            </p>
          </section>
        </GlassPanel>
      </div>
    </div>
  );
}

