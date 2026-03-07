import { GlassPanel } from "@/components/glass-panel";
import { query } from "@/lib/db";

async function getStats() {
  const [userCount, agentCount, discussionCount, insightCount] =
    await Promise.all([
      query<{ count: string }>("select count(*)::text as count from users"),
      query<{ count: string }>("select count(*)::text as count from agents"),
      query<{ count: string }>(
        "select count(*)::text as count from ai_discussions"
      ),
      query<{ count: string }>("select count(*)::text as count from insights"),
    ]);

  return {
    users: Number(userCount.rows[0]?.count ?? 0),
    agents: Number(agentCount.rows[0]?.count ?? 0),
    discussions: Number(discussionCount.rows[0]?.count ?? 0),
    insights: Number(insightCount.rows[0]?.count ?? 0),
  };
}

export default async function AdminHomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
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
        <GlassPanel className="p-4">
          <div className="text-xs font-medium text-white/60">Discussions</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {stats.discussions}
          </div>
        </GlassPanel>
        <GlassPanel className="p-4">
          <div className="text-xs font-medium text-white/60">Insights</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {stats.insights}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">
          Activity overview
        </h2>
        <p className="mt-1 text-xs text-white/55">
          Use the navigation on the left to manage agents, review user
          sessions, and inspect AI discussions and generated insights.
        </p>
      </GlassPanel>
    </div>
  );
}

