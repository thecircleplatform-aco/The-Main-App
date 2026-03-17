"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  MessageSquare,
  Settings,
  Trash2,
  GitBranch,
  Cpu,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { GlassPanel } from "@/components/glass-panel";
import { releases, type ReleaseFeature } from "@/config/changelog";
import { useVersion } from "@/components/VersionDisplay";
import { fadeInUp, softSpring } from "@/lib/animations";

const iconMap: Record<NonNullable<ReleaseFeature["icon"]>, React.ElementType> = {
  sparkle: Sparkles,
  shield: Shield,
  message: MessageSquare,
  settings: Settings,
  trash: Trash2,
  version: GitBranch,
  heart: Heart,
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      staggerDirection: 1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...softSpring,
      opacity: { duration: 0.4 },
    },
  },
};

const featureVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1 + i * 0.05,
      ...softSpring,
    },
  }),
};

export default function ChangelogPage() {
  const version = useVersion();

  return (
    <div className="min-h-dvh px-4 pb-24 pt-14 md:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={softSpring}
          className="mb-8"
        >
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-xs font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-white/60 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Settings
          </Link>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={softSpring}
          className="mb-12"
        >
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            What&apos;s new
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
            Features and improvements by version. You&apos;re on{" "}
            <span className="font-medium text-gray-800 dark:text-white/80">
              v{version?.appVersion ?? "—"}
            </span>
            {version?.gitVersion && (
              <span className="ml-1 font-mono text-gray-500 dark:text-white/50">
                ({version.gitVersion})
              </span>
            )}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {releases.map((release, releaseIndex) => (
            <motion.article
              key={release.version}
              variants={itemVariants}
              className="relative"
            >
              <GlassPanel className="overflow-visible p-6 sm:p-8">
                <div className="absolute -right-2 -top-2 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
                <div className="absolute -bottom-2 -left-2 h-20 w-20 rounded-full bg-cyan-500/10 blur-xl" />

                <div className="relative flex flex-wrap items-baseline gap-2">
                  <span className=" rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-300">
                    v{release.version}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                    <span className="inline-flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-cyan-400" />
                      {release.aiVersion}
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-white/40">{release.date}</span>
                </div>

                <motion.ul
                  className="mt-6 space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {release.features.map((feature, i) => {
                    const Icon = feature.icon
                      ? iconMap[feature.icon]
                      : Sparkles;
                    return (
                      <motion.li
                        key={feature.title}
                        custom={i}
                        variants={featureVariants}
                        className="flex gap-4"
                      >
                        <motion.div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-white/5"
                          whileHover={{
                            scale: 1.05,
                            backgroundColor: "rgba(255,255,255,0.08)",
                          }}
                          transition={softSpring}
                        >
                          <Icon className="h-4 w-4 text-gray-600 dark:text-white/70" />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {feature.title}
                          </h3>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-white/60">
                            {feature.description}
                          </p>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </GlassPanel>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-[11px] text-gray-500 dark:text-white/40">
            Built with Circle
          </p>
        </motion.div>
      </div>
    </div>
  );
}
