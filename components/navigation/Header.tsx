"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MoreHorizontal,
  Moon,
  Plus,
  Sun,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/NotificationsBell";
import { useTheme } from "@/contexts/ThemeContext";

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dropsOptionsOpen, setDropsOptionsOpen] = React.useState(false);
  const [dropsFeedTab, setDropsFeedTab] = React.useState<"posts" | "videos">("posts");
  const [dropsVideoMode, setDropsVideoMode] = React.useState(false);
  const { resolved, setTheme } = useTheme();
  const pathname = usePathname() || "/";

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ tab: "posts" | "videos" }>;
      if (ev.detail?.tab) setDropsFeedTab(ev.detail.tab);
    };
    window.addEventListener("drops-feed-tab-changed", handler as EventListener);
    return () =>
      window.removeEventListener("drops-feed-tab-changed", handler as EventListener);
  }, []);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ enabled?: boolean }>;
      setDropsVideoMode(!!ev.detail?.enabled);
    };
    window.addEventListener("drops-video-mode-changed", handler as EventListener);
    return () =>
      window.removeEventListener("drops-video-mode-changed", handler as EventListener);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (pathname === "/drops" && dropsVideoMode) return null;

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-50",
          "border-b border-violet-200/70 bg-white/80 text-violet-950 backdrop-blur-xl",
          "dark:border-white/10 dark:bg-[#0b071a]/70 dark:text-white",
          "px-4",
          "pt-[env(safe-area-inset-top)]"
        )}
        style={{ height: "calc(56px + env(safe-area-inset-top))" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="text-[18px] font-semibold tracking-tight text-violet-950 dark:text-white"
              aria-label="Circle home"
            >
              {pathname === "/drops" ? "Drops" : "Circle"}
            </Link>

            {pathname === "/drops" && (
              <div
                className={cn(
                  "hidden sm:inline-flex rounded-full border p-0.5 text-[11px]",
                  "border-slate-200/80 bg-white/75 backdrop-blur-xl shadow-[0_10px_30px_rgba(2,6,23,0.08)] ring-1 ring-black/5",
                  "dark:border-white/10 dark:bg-[#0b0f19]/55 dark:ring-white/10 dark:shadow-[0_14px_45px_rgba(0,0,0,0.45)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDropsFeedTab("posts");
                    window.dispatchEvent(
                      new CustomEvent("drops-feed-tab", { detail: { tab: "posts" } })
                    );
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition-colors",
                    dropsFeedTab === "posts"
                      ? "bg-violet-600/15 text-violet-950 ring-1 ring-violet-500/25 dark:bg-white/10 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
                  )}
                >
                  Posts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropsFeedTab("videos");
                    window.dispatchEvent(
                      new CustomEvent("drops-feed-tab", { detail: { tab: "videos" } })
                    );
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition-colors",
                    dropsFeedTab === "videos"
                      ? "bg-violet-600/15 text-violet-950 ring-1 ring-violet-500/25 dark:bg-white/10 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
                  )}
                >
                  Videos
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center gap-2">
              <NotificationsBell />

              <div
                className={cn(
                  "inline-flex items-center rounded-full p-0.5",
                  "border border-violet-200/70 bg-violet-500/10",
                  "dark:border-white/10 dark:bg-violet-500/15",
                  "backdrop-blur-xl"
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (pathname === "/circles") {
                      window.dispatchEvent(
                        new CustomEvent("open-explore-circles")
                      );
                      return;
                    }
                    if (pathname === "/drops") {
                      setDropsOptionsOpen(true);
                      return;
                    }
                    setOpen(true);
                  }}
                  className={cn(
                    "inline-flex h-8 w-9 items-center justify-center rounded-full",
                    "text-violet-700 hover:bg-violet-500/10 active:bg-violet-500/15",
                    "dark:text-white/95 dark:hover:bg-white/10 dark:active:bg-white/15"
                  )}
                  aria-label={
                    pathname === "/circles" ? "Explore circles" : "Create"
                  }
                >
                  <Plus className="h-[18px] w-[18px]" />
                </button>
                <div
                  className="h-4 w-px bg-violet-200/80 dark:bg-white/20"
                  aria-hidden
                />
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-8 w-9 items-center justify-center rounded-full",
                    "text-violet-700 hover:bg-violet-500/10 active:bg-violet-500/15",
                    "dark:text-white/95 dark:hover:bg-white/10 dark:active:bg-white/15"
                  )}
                  aria-label="Toggle theme"
                  onClick={() =>
                    setTheme(resolved === "dark" ? "light" : "dark")
                  }
                >
                  {resolved === "dark" ? (
                    <Sun className="h-[18px] w-[18px]" />
                  ) : (
                    <Moon className="h-[18px] w-[18px]" />
                  )}
                </button>
                <div
                  className="h-4 w-px bg-violet-200/80 dark:bg-white/20"
                  aria-hidden
                />
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-8 w-9 items-center justify-center rounded-full",
                    "text-violet-700 hover:bg-violet-500/10 active:bg-violet-500/15",
                    "dark:text-white/95 dark:hover:bg-white/10 dark:active:bg-white/15"
                  )}
                  aria-label="More"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <MoreHorizontal className="h-[18px] w-[18px]" />
                </button>
              </div>

              {menuOpen && (
                <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-xl border border-violet-200/70 bg-white/95 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/95">
                  {pathname === "/drops" && (
                    <>
                      <button
                        type="button"
                        className={cn(
                          "block w-full px-3 py-2 text-left text-xs font-medium",
                          "text-violet-950 hover:bg-violet-500/10 dark:text-white/90 dark:hover:bg-white/5"
                        )}
                        onClick={() => {
                          setDropsFeedTab("posts");
                          window.dispatchEvent(
                            new CustomEvent("drops-feed-tab", {
                              detail: { tab: "posts" },
                            })
                          );
                          setMenuOpen(false);
                        }}
                      >
                        Posts
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "block w-full px-3 py-2 text-left text-xs font-medium",
                          "text-violet-950 hover:bg-violet-500/10 dark:text-white/90 dark:hover:bg-white/5"
                        )}
                        onClick={() => {
                          setDropsFeedTab("videos");
                          window.dispatchEvent(
                            new CustomEvent("drops-feed-tab", {
                              detail: { tab: "videos" },
                            })
                          );
                          setMenuOpen(false);
                        }}
                      >
                        Videos
                      </button>
                      <div
                        className="h-px bg-violet-200/70 dark:bg-white/10"
                        aria-hidden
                      />
                    </>
                  )}
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-xs font-medium text-violet-950 hover:bg-violet-500/10 dark:text-white/90 dark:hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-6 pt-20"
          role="dialog"
          aria-modal="true"
          aria-label="Create modal"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70"
            aria-label="Close modal"
          />

          <div
            className={cn(
              "relative w-full max-w-md rounded-2xl",
              "border border-white/10 bg-[#07101e]/90 text-white shadow-soft backdrop-blur-xl"
            )}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm font-semibold">Create</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full",
                  "border border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
                )}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 pb-4 text-sm text-white/75">
              Temporary placeholder modal.
            </div>
          </div>
        </div>
      )}

      {/* Drops create options: Create Post | Upload Video */}
      {pathname === "/drops" && dropsOptionsOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-8 pt-20"
          role="dialog"
          aria-modal="true"
          aria-label="Create post or video"
        >
          <button
            type="button"
            onClick={() => setDropsOptionsOpen(false)}
            className="absolute inset-0 bg-black/70"
            aria-label="Close"
          />
          <div
            className={cn(
              "relative w-full max-w-md rounded-2xl border p-4",
              "bg-white/85 text-slate-900 border-slate-200/80 backdrop-blur-xl ring-1 ring-black/5",
              "shadow-[0_20px_70px_rgba(2,6,23,0.22)]",
              "dark:bg-[#0b0f19]/70 dark:text-slate-100 dark:border-white/10 dark:ring-white/10",
              "dark:shadow-[0_20px_70px_rgba(0,0,0,0.55)]"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Create
              </span>
              <button
                type="button"
                onClick={() => setDropsOptionsOpen(false)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10",
                  "dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                )}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setDropsOptionsOpen(false);
                  window.dispatchEvent(
                    new CustomEvent("open-drops-create-modal", {
                      detail: { mode: "post" },
                    })
                  );
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  "border-slate-200/80 bg-white/70 hover:bg-white/90",
                  "shadow-[0_10px_30px_rgba(2,6,23,0.06)] ring-1 ring-black/5",
                  "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:ring-white/10 dark:shadow-[0_14px_45px_rgba(0,0,0,0.35)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    "bg-violet-600/10 text-violet-700 ring-1 ring-violet-500/15",
                    "dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-400/20"
                  )}
                >
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    Create Post
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300/70">
                    Share text and images with your circles
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDropsOptionsOpen(false);
                  window.dispatchEvent(
                    new CustomEvent("open-drops-create-modal", {
                      detail: { mode: "video" },
                    })
                  );
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  "border-slate-200/80 bg-white/70 hover:bg-white/90",
                  "shadow-[0_10px_30px_rgba(2,6,23,0.06)] ring-1 ring-black/5",
                  "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:ring-white/10 dark:shadow-[0_14px_45px_rgba(0,0,0,0.35)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    "bg-violet-600/10 text-violet-700 ring-1 ring-violet-500/15",
                    "dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-400/20"
                  )}
                >
                  <VideoIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    Upload Video
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300/70">
                    Short vertical video, up to 60 seconds
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

