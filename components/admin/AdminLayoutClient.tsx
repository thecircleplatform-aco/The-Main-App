"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminSession } from "@/lib/admin";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/discussions", label: "Discussions" },
  { href: "/admin/admins", label: "Admins" },
];

export function AdminLayoutClient({
  admin,
  children,
}: {
  admin: AdminSession;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login?from=/admin";
  }

  const navLinks = (
    <nav className="space-y-1 rounded-3xl border border-white/12 bg-black/40 p-2 shadow-soft backdrop-blur-2xl">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "block rounded-2xl px-3 py-2 text-sm text-white/75 transition hover:bg-white/8 hover:text-white",
              isActive && "bg-white/15 text-white font-medium"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-50 -mx-4 -mt-12 mb-6 flex items-center justify-between gap-4 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link
            href="/admin"
            className="text-sm font-medium text-white/80 transition hover:text-white"
          >
            Admin Panel
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-xs text-white/50 capitalize">{admin.role}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {admin.email}
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
          >
            Back to app
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-rose-500/20 hover:text-rose-300"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 pt-2 md:flex-row">
        {/* Desktop sidebar - always visible */}
        <aside className="relative z-10 w-full flex-shrink-0 md:w-60">
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Circle Admin
            </div>
            <h1 className="mt-3 text-lg font-semibold text-white">Dashboard</h1>
            <p className="mt-1 text-xs text-white/45">
              Manage agents, users, and AI discussions.
            </p>
          </div>
          {navLinks}
        </aside>

        <main className="w-full flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile slide menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-[100] w-[260px] overflow-y-auto border-r border-white/10 bg-black/95 shadow-2xl backdrop-blur-2xl md:hidden"
            >
              <div className="relative flex h-full flex-col p-4">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
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
                {navLinks}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
