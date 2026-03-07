import { GlassPanel } from "@/components/glass-panel";
import { query } from "@/lib/db";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  sessions: number;
};

async function getUsers(): Promise<UserRow[]> {
  const res = await query<UserRow>(
    `
    select
      u.id,
      u.email,
      u.name,
      u.created_at,
      count(s.id)::int as sessions
    from users u
    left join sessions s on s.user_id = u.id
    group by u.id
    order by u.created_at desc
  `
  );
  return res.rows;
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Users</h2>
        <p className="mt-1 text-xs text-white/55">
          View who is using Circle and how many sessions they have created.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full border-separate border-spacing-y-2 text-xs text-white/80">
            <thead className="sticky top-0 z-10 bg-black/60 backdrop-blur-xl">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-white/60">
                  Email
                </th>
                <th className="px-3 py-2 text-left font-medium text-white/60">
                  Name
                </th>
                <th className="px-3 py-2 text-left font-medium text-white/60">
                  Sessions
                </th>
                <th className="px-3 py-2 text-left font-medium text-white/60">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-xs text-white/50"
                  >
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="rounded-2xl border border-white/8 bg-white/5 shadow-soft backdrop-blur-2xl"
                  >
                    <td className="px-3 py-2 align-middle">{u.email}</td>
                    <td className="px-3 py-2 align-middle">
                      {u.name ?? <span className="text-white/40">—</span>}
                    </td>
                    <td className="px-3 py-2 align-middle">{u.sessions}</td>
                    <td className="px-3 py-2 align-middle text-white/55">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}

