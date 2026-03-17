import { GlassPanel } from "@/components/glass-panel";
import { query } from "@/database/db";

async function getStats() {
  const [userCount, agentCount] = await Promise.all([
    query<{ count: string }>("select count(*)::text as count from users"),
    query<{ count: string }>("select count(*)::text as count from agents"),
  ]);

  return {
    users: Number(userCount.rows[0]?.count ?? 0),
    agents: Number(agentCount.rows[0]?.count ?? 0),
  };
}

export default async function AdminHomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <GlassPanel className="p-4">
          <div className="text-xs font-medium text-white/60">Users</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {stats.users}
          </div>
        </GlassPanel>
        <GlassPanel className="p-4">
          <div className="text-xs font-medium text-white/60">Agents</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {stats.agents}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">
          Activity overview
        </h2>
        <p className="mt-1 text-xs text-white/55">
          Use the navigation on the left to manage agents and review user sessions.
        </p>
      </GlassPanel>
    </div>
  );
}

