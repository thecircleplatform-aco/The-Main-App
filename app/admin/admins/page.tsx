import { redirect } from "next/navigation";
import { GlassPanel } from "@/components/glass-panel";
import { query } from "@/database/db";
import { getAdminSession, canManageAdmins } from "@/services/admin";
import { AdminAdminsManager } from "@/components/admin/AdminAdminsManager";

type AdminRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

async function getAdmins(): Promise<AdminRow[]> {
  const res = await query<AdminRow>(
    `select id, email, role, created_at from admin_users order by created_at asc`
  );
  return res.rows;
}

export default async function AdminAdminsPage() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/login?from=/admin/admins");
  }

  const admins = await getAdmins();

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Admins</h2>
        <p className="mt-1 text-xs text-white/55">
          Manage who has access to the admin panel. Owners can add and remove
          admins; admins can manage agents and users; viewers have read-only
          access.
        </p>
      </GlassPanel>
      <AdminAdminsManager
        admins={admins}
        currentAdminEmail={admin.email}
        canManageAdmins={canManageAdmins(admin.role)}
      />
    </div>
  );
}
