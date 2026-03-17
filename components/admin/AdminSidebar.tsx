"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminSession } from "@/services/admin";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/discussions", label: "Discussions" },
  { href: "/admin/admins", label: "Admins" },
];

const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => {
  const pathname = usePathname();
  return (
    <>
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Circle Admin
        </div>
        <h1 className="mt-3 text-lg font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-xs text-white/45">
          Manage agents and users.
        </p>
      </div>
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
              onClick={onNavClick}
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
    </>
  );
};

export function AdminSidebar({ admin: _admin }: { admin: AdminSession }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Desktop: always-visible sidebar */}
      <aside className="hidden w-60 flex-shrink-0 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile: slide menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
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
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
                <SidebarContent onNavClick={() => setOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
