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
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-white/10 bg-[#07101e]/65 backdrop-blur-xl",
        "px-2",
        "pb-[env(safe-area-inset-bottom)]"
      )}
      aria-label="Bottom navigation"
      style={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-5 items-center">
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
                  "border border-white/10 bg-white/5",
                  isActive
                    ? "shadow-glow"
                    : "hover:bg-white/10 active:bg-white/15"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-white" : "text-white/80"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isActive ? "text-white" : "text-white/70"
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
                isActive ? "text-white" : "text-white/70 hover:text-white/90"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {item.badge && (
                <span
                  className={cn(
                    "absolute -top-1.5 right-3 rounded-full px-2 py-0.5",
                    "bg-sky-400/35 text-[10px] font-semibold text-white",
                    "border border-white/10 backdrop-blur-xl"
                  )}
                  aria-hidden="true"
                >
                  {item.badge}
                </span>
              )}
              <item.Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-white" : "text-white/75"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-white" : "text-white/65"
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

