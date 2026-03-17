"use client";

import Link from "next/link";
import { performLogout } from "@/lib/logout";
import type { AdminSession } from "@/services/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminHeader({ admin }: { admin: AdminSession }) {
  async function handleLogout() {
    await performLogout();
  }

  return (
    <header className="sticky top-0 z-50 -mx-4 -mt-12 mb-6 flex items-center justify-between gap-4 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
      <div className="flex items-center gap-3">
        <AdminSidebar admin={admin} />
        <Link
          href="/admin"
          className="text-sm font-medium text-white/80 hover:text-white transition"
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
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 transition"
        >
          Back to app
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-rose-500/20 hover:text-rose-300 transition"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
