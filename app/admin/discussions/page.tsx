import { GlassPanel } from "@/components/glass-panel";
import { query } from "@/lib/db";

type DiscussionRow = {
  id: string;
  topic: string;
  agent_name: string;
  created_at: string;
};

type InsightRow = {
  id: string;
  user_email: string | null;
  title: string;
  created_at: string;
};

async function getDiscussions(): Promise<DiscussionRow[]> {
  const res = await query<DiscussionRow>(
    `
    select id, topic, agent_name, created_at
    from ai_discussions
    order by created_at desc
    limit 100
  `
  );
  return res.rows;
}

async function getInsights(): Promise<InsightRow[]> {
  const res = await query<InsightRow>(
    `
    select i.id, u.email as user_email, i.title, i.created_at
    from insights i
    left join users u on u.id = i.user_id
    order by i.created_at desc
    limit 100
  `
  );
  return res.rows;
}

export default async function AdminDiscussionsPage() {
  const [discussions, insights] = await Promise.all([
    getDiscussions(),
    getInsights(),
  ]);

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">AI discussions</h2>
        <p className="mt-1 text-xs text-white/55">
          Inspect what the council has been debating and which insights have
          been generated.
        </p>
      </GlassPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Recent discussions
          </h3>
          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {discussions.length === 0 ? (
              <p className="py-8 text-center text-xs text-white/45">
                No discussions recorded yet.
              </p>
            ) : (
              discussions.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 shadow-soft backdrop-blur-2xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="line-clamp-1 font-semibold text-[13px]">
                      {d.topic}
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-[2px] text-[10px] text-white/60">
                      {d.agent_name}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-white/45">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Generated insights
          </h3>
          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {insights.length === 0 ? (
              <p className="py-8 text-center text-xs text-white/45">
                No insights stored yet.
              </p>
            ) : (
              insights.map((i) => (
                <div
                  key={i.id}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-50 shadow-soft backdrop-blur-2xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="line-clamp-1 font-semibold text-[13px]">
                      {i.title}
                    </div>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-[2px] text-[10px] text-emerald-100">
                      {i.user_email ?? "Unknown user"}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-emerald-100/80">
                    {new Date(i.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

