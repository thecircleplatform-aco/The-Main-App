import { AdminAgentManager } from "@/components/admin/AdminAgentManager";
import { GlassPanel } from "@/components/glass-panel";

export default function AdminAgentsPage() {
  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Agents</h2>
        <p className="mt-1 text-xs text-white/55">
          Create and curate the AI council&apos;s personalities. Agents can be
          enabled or disabled without losing their configuration.
        </p>
      </GlassPanel>
      <AdminAgentManager />
    </div>
  );
}

