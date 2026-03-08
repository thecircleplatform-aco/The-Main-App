import { GlassPanel } from "@/components/glass-panel";
import { query } from "@/lib/db";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  status: string | null;
  created_at: string;
  sessions: number;
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
        count(s.id)::int as sessions
      from users u
      left join sessions s on s.user_id = u.id
      group by u.id, u.email, u.name, u.created_at, u.status
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
          count(s.id)::int as sessions
        from users u
        left join sessions s on s.user_id = u.id
        group by u.id, u.email, u.name, u.created_at
        order by u.created_at desc
      `
      );
      return res.rows.map((r) => ({ ...r, status: "active" as string | null }));
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

