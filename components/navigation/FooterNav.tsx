"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Droplet,
  Home,
  MessageCircle,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  isCenter?: boolean;
  badge?: string;
  matches?: (pathname: string) => boolean;
};

const NAV: NavItem[] = [
  {
    href: "/circles",
    label: "Circles",
    Icon: Users,
    badge: "67",
    matches: (p) => p === "/circles" || p.startsWith("/circles/"),
  },
  { href: "/drops", label: "Drops", Icon: Droplet },
  { href: "/home", label: "Home", Icon: Home, isCenter: true },
  { href: "/chats", label: "Chats", Icon: MessageCircle },
  { href: "/profile", label: "Profile", Icon: User },
];

export function FooterNav() {
  const pathname = usePathname() || "/";

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 z-50",
        "px-3"
      )}
      aria-label="Bottom navigation"
      style={{
        bottom: "calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <div
        className={cn(
          "mx-auto grid h-14 w-full max-w-6xl grid-cols-5 items-center",
          "rounded-full border border-violet-200/70 bg-white/80 backdrop-blur-xl",
          "shadow-[0_14px_45px_rgba(15,23,42,0.18)]",
          "dark:border-white/12 dark:bg-[#0b071a]/70 dark:shadow-[0_14px_45px_rgba(0,0,0,0.45)]",
          "ring-1 ring-violet-200/50 dark:ring-white/10",
          "px-1.5"
        )}
      >
        {NAV.map((item) => {
          const isActive = item.matches
            ? item.matches(pathname)
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const base =
            "relative flex flex-col items-center justify-center gap-1 py-1";

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  base,
                  "relative",
                  "mx-auto w-[72px] rounded-2xl",
                  "border border-violet-200/70 bg-violet-500/10",
                  "dark:border-white/10 dark:bg-white/5",
                  isActive
                    ? "shadow-glow"
                    : "hover:bg-violet-500/15 active:bg-violet-500/20 dark:hover:bg-white/10 dark:active:bg-white/15"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive
                      ? "text-violet-950 dark:text-white"
                      : "text-violet-800/80 dark:text-white/80"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive
                      ? "text-violet-950 dark:text-white"
                      : "text-violet-800/70 dark:text-white/70"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                base,
                "rounded-xl",
                isActive
                  ? "text-violet-950 dark:text-white"
                  : "text-violet-800/70 hover:text-violet-950 dark:text-white/70 dark:hover:text-white/90"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative inline-flex">
                <item.Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive
                      ? "text-violet-950 dark:text-white"
                      : "text-violet-800/70 dark:text-white/75"
                  )}
                />
                {item.badge && (
                  <span
                    className={cn(
                      "absolute -top-2.5 -right-2.5 min-w-[14px] h-[14px] rounded-full px-1",
                      "grid place-items-center text-[9px] font-semibold leading-none",
                      "bg-violet-500/15 text-violet-900",
                      "border border-violet-200/70 backdrop-blur-xl",
                      "dark:bg-violet-500/20 dark:text-white dark:border-white/10"
                    )}
                    aria-hidden="true"
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive
                    ? "text-violet-950 dark:text-white"
                    : "text-violet-800/65 dark:text-white/65"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

