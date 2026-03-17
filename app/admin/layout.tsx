import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/services/admin";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/login?from=/admin");
  }
  return (
    <div className="min-h-dvh px-4 pb-16 pt-12 md:px-8">
      <AdminLayoutClient admin={admin}>{children}</AdminLayoutClient>
    </div>
  );
}

