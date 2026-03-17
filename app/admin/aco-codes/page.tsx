import { redirect } from "next/navigation";
import { GlassPanel } from "@/components/glass-panel";
import { getAdminSession, canEditContent } from "@/services/admin";
import { AdminAcoCodesManager } from "@/components/admin/AdminAcoCodesManager";

export default async function AdminAcoCodesPage() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/login?from=/admin/aco-codes");
  }

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Access Codes</h2>
        <p className="mt-1 text-xs text-white/55">
          Create and manage invitation codes for testers, developers, and partners.
          Users can enter an optional code at signup to receive the assigned role.
        </p>
      </GlassPanel>
      <AdminAcoCodesManager canEdit={canEditContent(admin.role)} />
    </div>
  );
}
