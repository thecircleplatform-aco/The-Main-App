import { GlassPanel } from "@/components/glass-panel";
import { query } from "@/database/db";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  status: string | null;
  created_at: string;
  sessions: number;
  provider: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
  phone_login_disabled: boolean | null;
};

async function getUsers(): Promise<UserRow[]> {
  try {
    const res = await query<UserRow>(
      `
      select
        u.id,
        u.email,
        u.name,
        u.status,
        u.created_at,
        coalesce(u.provider, 'email') as provider,
        u.phone_number,
        coalesce(u.phone_verified, false) as phone_verified,
        coalesce(u.phone_login_disabled, false) as phone_login_disabled,
        count(s.id)::int as sessions
      from users u
      left join sessions s on s.user_id = u.id
      group by u.id, u.email, u.name, u.created_at, u.status, u.provider, u.phone_number, u.phone_verified, u.phone_login_disabled
      order by u.created_at desc
    `
    );
    return res.rows;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("status") && msg.includes("does not exist")) {
      const res = await query<UserRow & { status?: string }>(
        `
        select
          u.id,
          u.email,
          u.name,
          u.created_at,
          coalesce(u.provider, 'email') as provider,
          u.phone_number,
          coalesce(u.phone_verified, false) as phone_verified,
          coalesce(u.phone_login_disabled, false) as phone_login_disabled,
          count(s.id)::int as sessions
        from users u
        left join sessions s on s.user_id = u.id
        group by u.id, u.email, u.name, u.created_at, u.provider, u.phone_number, u.phone_verified, u.phone_login_disabled
        order by u.created_at desc
      `
      );
      return res.rows.map((r) => ({ ...r, status: "active" as string | null }));
    }
    if (msg.includes("provider") && msg.includes("does not exist")) {
      const res = await query<Omit<UserRow, "provider"> & { provider?: string }>(
        `
        select
          u.id,
          u.email,
          u.name,
          u.status,
          u.created_at,
          count(s.id)::int as sessions
        from users u
        left join sessions s on s.user_id = u.id
        group by u.id, u.email, u.name, u.created_at, u.status
        order by u.created_at desc
      `
      );
      return res.rows.map((r) => ({ ...r, provider: "email" as string | null, phone_number: null, phone_verified: false, phone_login_disabled: false }));
    }
    if (msg.includes("phone_number") || msg.includes("phone_verified") || msg.includes("phone_login_disabled")) {
      const res = await query<Omit<UserRow, "phone_number" | "phone_verified" | "phone_login_disabled"> & { phone_number?: string; phone_verified?: boolean; phone_login_disabled?: boolean }>(
        `
        select
          u.id,
          u.email,
          u.name,
          u.status,
          u.created_at,
          coalesce(u.provider, 'email') as provider,
          count(s.id)::int as sessions
        from users u
        left join sessions s on s.user_id = u.id
        group by u.id, u.email, u.name, u.created_at, u.status, u.provider
        order by u.created_at desc
      `
      );
      return res.rows.map((r) => ({ ...r, phone_number: null, phone_verified: false, phone_login_disabled: false }));
    }
    throw err;
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Users</h2>
        <p className="mt-1 text-xs text-white/55">
          Manage users, block/unblock, and view activity. Right-click a user row
          for options.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        <AdminUsersTable users={users} />
      </GlassPanel>
    </div>
  );
}

