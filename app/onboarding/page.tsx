"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PersonaSetupForm } from "@/components/onboarding/PersonaSetupForm";
import { fadeInUp } from "@/lib/animations";

export default function OnboardingPage() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/persona/me");
        if (cancelled) return;
        if (res.ok) router.replace("/");
      } catch {
        // proceed to show form
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
      <div className="relative min-h-dvh px-4 pb-20 pt-14 md:px-8">
        <div className="mx-auto max-w-lg">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Personalize your Circle
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                Answer a few questions so your AI assistant can support you
                better.
              </p>
            </div>
            <PersonaSetupForm />
          </motion.div>
        </div>
      </div>
  );
}
