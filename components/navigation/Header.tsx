"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Moon, Plus, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/NotificationsBell";
import { useTheme } from "@/contexts/ThemeContext";

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { resolved, setTheme } = useTheme();
  const pathname = usePathname() || "/";

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

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
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between">
          <Link
            href="/home"
            className="text-[18px] font-semibold tracking-tight text-violet-950 dark:text-white"
            aria-label="Circle home"
          >
            Circle
          </Link>

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
                    window.dispatchEvent(new CustomEvent("open-explore-circles"));
                    return;
                  }
                  setOpen(true);
                }}
                className={cn(
                  "inline-flex h-8 w-9 items-center justify-center rounded-full",
                  "text-violet-700 hover:bg-violet-500/10 active:bg-violet-500/15",
                  "dark:text-white/95 dark:hover:bg-white/10 dark:active:bg-white/15"
                )}
                aria-label={pathname === "/circles" ? "Explore circles" : "Create"}
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
                onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
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
                  <Link
                    href="/settings"
                    className="block px-3 py-2 text-xs font-medium text-violet-950 hover:bg-violet-500/10 dark:text-white/90 dark:hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
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
    </>
  );
}

