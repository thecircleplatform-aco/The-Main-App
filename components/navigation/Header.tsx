"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = React.useState(false);

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
          "border-b border-white/10 bg-[#07101e]/65 backdrop-blur-xl",
          "px-4",
          "pt-[env(safe-area-inset-top)]"
        )}
        style={{ height: "calc(56px + env(safe-area-inset-top))" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between">
          <Link
            href="/home"
            className="text-[22px] font-semibold tracking-tight text-white"
            aria-label="Circle home"
          >
            Circle
          </Link>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center overflow-hidden rounded-full",
                "border border-white/10 bg-sky-400/35",
                "backdrop-blur-xl"
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                  "inline-flex h-9 w-10 items-center justify-center",
                  "text-white hover:bg-white/10 active:bg-white/15"
                )}
                aria-label="Create"
              >
                <Plus className="h-5 w-5" />
              </button>
              <div className="h-5 w-px bg-white/20" aria-hidden />
              <button
                type="button"
                className={cn(
                  "inline-flex h-9 w-10 items-center justify-center",
                  "text-white/95 hover:bg-white/10 active:bg-white/15"
                )}
                aria-label="Users"
              >
                <Users className="h-5 w-5" />
              </button>
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

