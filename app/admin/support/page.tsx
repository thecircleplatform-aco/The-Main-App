import { GlassPanel } from "@/components/glass-panel";
import { SupportTicketViewer } from "@/components/admin/SupportTicketViewer";
import { query } from "@/lib/db";

type Ticket = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

async function getTickets(): Promise<Ticket[]> {
  try {
    const res = await query<Ticket>(
      `SELECT t.id, t.user_id, u.email as user_email, u.name as user_name,
              t.message, t.status, t.admin_response, t.created_at, t.updated_at
       FROM support_tickets t
       LEFT JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC
       LIMIT 200`
    );
    return res.rows;
  } catch {
    return [];
  }
}

export default async function AdminSupportPage() {
  const tickets = await getTickets();

  return (
    <div className="space-y-5">
      <GlassPanel className="p-5">
        <h2 className="text-sm font-semibold text-white">Support</h2>
        <p className="mt-1 text-xs text-white/55">
          View support tickets from blocked users and respond or unblock.
        </p>
      </GlassPanel>

      <SupportTicketViewer tickets={tickets} />
    </div>
  );
}
