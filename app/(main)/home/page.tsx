"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Sparkles, MessageCircle } from "lucide-react";
import { InteractiveBackground } from "@/components/background/InteractiveBackground";
import { SearchGlobal } from "@/components/SearchGlobal";
import { NotificationsBell } from "@/components/NotificationsBell";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

type LiveFeedItem = {
  id: string;
  circleName: string;
  circleSlug: string;
  messagePreview: string;
  timestamp: string;
};

type SimpleCircle = {
  id: string;
  name: string;
  slug: string;
  members: number;
  activityLabel: string;
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const hoverGlow = "transition hover:shadow-glow hover:border-cyan-400/60";

export default function Home() {
  const router = useRouter();
  const { resolved } = useTheme();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/persona/me");
        if (cancelled) return;
        if (res.status === 404) {
          router.replace("/onboarding");
        }
      } catch {
        // If this fails, still render the home experience; auth will guard API calls.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const [liveFeed] = React.useState<LiveFeedItem[]>([
    {
      id: "1",
      circleName: "Product Builders",
      circleSlug: "product-builders",
      messagePreview: "“Just shipped the new onboarding flow – feedback welcome.”",
      timestamp: "Just now",
    },
    {
      id: "2",
      circleName: "AI in Production",
      circleSlug: "ai-in-production",
      messagePreview: "“Anyone running RAG on top of analytics data?”",
      timestamp: "2 min ago",
    },
    {
      id: "3",
      circleName: "Design Critique",
      circleSlug: "design-critique",
      messagePreview: "Shared a new dashboard concept for async reviews.",
      timestamp: "8 min ago",
    },
  ]);

  const [yourCircles] = React.useState<SimpleCircle[]>([
    {
      id: "yc-1",
      name: "Founders Circle",
      slug: "founders-circle",
      members: 132,
      activityLabel: "Active daily",
    },
    {
      id: "yc-2",
      name: "Indie Hackers",
      slug: "indie-hackers",
      members: 412,
      activityLabel: "Busy right now",
    },
    {
      id: "yc-3",
      name: "Marketing Lab",
      slug: "marketing-lab",
      members: 233,
      activityLabel: "New posts",
    },
  ]);

  const [trendingCircles] = React.useState<SimpleCircle[]>([
    {
      id: "tr-1",
      name: "AI Builders",
      slug: "ai-builders",
      members: 982,
      activityLabel: "147 online",
    },
    {
      id: "tr-2",
      name: "No-Code Ops",
      slug: "no-code-ops",
      members: 543,
      activityLabel: "Surging this week",
    },
    {
      id: "tr-3",
      name: "Remote Leaders",
      slug: "remote-leaders",
      members: 678,
      activityLabel: "Daily standups",
    },
  ]);

  const [suggestedCircles] = React.useState<SimpleCircle[]>([
    {
      id: "sg-1",
      name: "Early-Stage Founders",
      slug: "early-stage-founders",
      members: 264,
      activityLabel: "Matches your topics",
    },
    {
      id: "sg-2",
      name: "Growth Experiments",
      slug: "growth-experiments",
      members: 321,
      activityLabel: "High response rate",
    },
    {
      id: "sg-3",
      name: "Launch Announcements",
      slug: "launch-announcements",
      members: 754,
      activityLabel: "Great for big moments",
    },
  ]);

  const handleOpenCircle = (slug: string) => {
    router.push(`/circles/${encodeURIComponent(slug)}`);
  };

  const handleFabClick = () => {
    router.push("/circles");
  };

  return (
    <>
      <InteractiveBackground maxIcons={18} />

      <div
        className={cn(
          "relative flex min-h-dvh flex-col transition-colors",
          "text-slate-900 dark:text-slate-100",
          resolved === "dark"
            ? "circle-chat-bg"
            : "bg-gradient-to-b from-slate-50 via-sky-50/70 to-indigo-50"
        )}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-500/10 via-transparent to-indigo-500/20" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6">
          <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-white/60">
            HOME PAGE
          </div>

          {/* Top navigation (screen header) */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-gradient-to-r from-slate-50/90 via-sky-50/80 to-slate-50/90 px-4 py-2.5 backdrop-blur-xl shadow-soft dark:border-white/10 dark:bg-black/40 dark:bg-none">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-violet-500 shadow-brand">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                  Circle
                </p>
                <p className="hidden text-[11px] text-slate-500 dark:text-white/60 sm:block">
                  Your communities, in one place.
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 text-slate-900 sm:gap-3 dark:text-white">
              <div className="hidden min-w-[180px] flex-1 sm:block md:max-w-xs">
                <SearchGlobal />
              </div>
              <NotificationsBell />
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 bg-slate-900/5 text-xs font-medium text-slate-900 dark:border-white/15 dark:bg-white/10 dark:text-white">
                {/* Simple profile placeholder; can be wired to real user avatar */}
                <span>C</span>
              </div>
            </div>
          </header>

          {/* Mobile search below nav */}
          <div className="relative sm:hidden">
            <SearchGlobal />
          </div>

          {/* Main content grid */}
          <main className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] md:gap-6">
            {/* Live feed */}
            <motion.section
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4 }}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur-xl shadow-soft dark:border-white/10 dark:bg-white/5",
                hoverGlow
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-sky-500 dark:bg-sky-500/20 dark:text-sky-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                      Live feed
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-200/70">
                      Latest moments from circles you&apos;re in.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-1 space-y-2.5">
                {liveFeed.map((item, index) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenCircle(item.circleSlug)}
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: index * 0.05, duration: 0.35 }}
                    className={cn(
                      "w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2.5 text-left text-xs text-slate-900 backdrop-blur-md dark:border-white/5 dark:bg-black/40 dark:text-slate-50/90",
                      "flex items-start justify-between gap-3",
                      "hover:bg-white/10",
                      hoverGlow
                    )}
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300/80">
                        {item.circleName}
                      </p>
                      <p className="line-clamp-2 text-[12px] text-slate-800 dark:text-slate-100">
                        {item.messagePreview}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-300/70">
                      {item.timestamp}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.section>

            {/* Right column: circles */}
            <div className="flex flex-col gap-4 md:gap-5">
              {/* Your circles */}
              <motion.section
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35 }}
                className={cn(
                  "rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 backdrop-blur-xl shadow-soft dark:border-white/10 dark:bg-white/5",
                  hoverGlow
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                    Your circles
                  </h3>
                  <button
                    type="button"
                    onClick={() => router.push("/circles")}
                    className="text-[11px] text-sky-300 hover:text-sky-200"
                  >
                    View all
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {yourCircles.map((circle) => (
                    <motion.button
                      key={circle.id}
                      type="button"
                      onClick={() => handleOpenCircle(circle.slug)}
                      whileHover={{ y: -2 }}
                      className={cn(
                        "min-w-[9rem] flex-1 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-left text-xs",
                        "backdrop-blur-md hover:bg-slate-50 dark:border-white/10 dark:bg-black/40 dark:hover:bg-white/10",
                        hoverGlow
                      )}
                    >
                      <p className="mb-0.5 line-clamp-2 text-[12px] font-medium text-slate-900 dark:text-slate-50">
                        {circle.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-300/70">
                        {circle.members.toLocaleString()} members •{" "}
                        {circle.activityLabel}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.section>

              {/* Trending circles */}
              <motion.section
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className={cn(
                  "rounded-2xl border border-cyan-400/40 bg-cyan-50 p-3.5 backdrop-blur-xl shadow-soft dark:border-cyan-400/25 dark:bg-cyan-500/5",
                  "shadow-brand-bubble"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                    Trending circles
                  </h3>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200">
                    Active now
                  </span>
                </div>
                <div className="space-y-1.5">
                  {trendingCircles.map((circle, index) => (
                    <motion.button
                      key={circle.id}
                      type="button"
                      onClick={() => handleOpenCircle(circle.slug)}
                      variants={fadeInUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-left text-xs",
                        "hover:bg-slate-50 dark:border-white/5 dark:bg-black/40 dark:hover:bg-white/10",
                        hoverGlow
                      )}
                    >
                      <div>
                        <p className="text-[12px] font-medium text-slate-900 dark:text-slate-50">
                          {circle.name}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300/70">
                          {circle.members.toLocaleString()} members •{" "}
                          {circle.activityLabel}
                        </p>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                    </motion.button>
                  ))}
                </div>
              </motion.section>

              {/* Suggested circles */}
              <motion.section
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className={cn(
                  "rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 backdrop-blur-xl shadow-soft dark:border-white/10 dark:bg-white/5",
                  hoverGlow
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                    Suggested for you
                  </h3>
                  <span className="text-[10px] text-slate-500/80 dark:text-slate-300/80">
                    Based on your activity
                  </span>
                </div>
                <div className="space-y-1.5">
                  {suggestedCircles.map((circle) => (
                    <motion.button
                      key={circle.id}
                      type="button"
                      onClick={() => handleOpenCircle(circle.slug)}
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-left text-xs",
                        "hover:bg-slate-50 dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/10",
                        hoverGlow
                      )}
                    >
                      <div>
                        <p className="text-[12px] font-medium text-slate-900 dark:text-slate-50">
                          {circle.name}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300/70">
                          {circle.members.toLocaleString()} members
                        </p>
                      </div>
                      <span className="text-[10px] text-sky-600 dark:text-sky-300">
                        {circle.activityLabel}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            </div>
          </main>

          {/* Floating action button */}
          <button
            type="button"
            onClick={handleFabClick}
            aria-label="Open circles"
            className={cn(
              "fixed bottom-6 right-6 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full",
              "bg-gradient-to-tr from-sky-500 to-violet-500 text-white shadow-brand hover:shadow-glow active:scale-95"
            )}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

