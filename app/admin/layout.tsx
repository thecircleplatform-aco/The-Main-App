import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/discussions", label: "Discussions" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh px-4 pb-16 pt-12 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row">
        <aside className="w-full md:w-60">
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Circle Admin
            </div>
            <h1 className="mt-3 text-lg font-semibold text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-xs text-white/45">
              Manage agents, users, and AI discussions.
            </p>
          </div>

          <nav className="space-y-1 rounded-3xl border border-white/12 bg-black/40 p-2 shadow-soft backdrop-blur-2xl">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-2xl px-3 py-2 text-sm text-white/75 hover:bg-white/8 hover:text-white transition",
                  "data-[active=true]:bg-white data-[active=true]:text-black"
                )}
                data-active={
                  typeof window !== "undefined" &&
                  window.location.pathname === item.href
                    ? "true"
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="w-full flex-1">{children}</main>
      </div>
    </div>
  );
}

