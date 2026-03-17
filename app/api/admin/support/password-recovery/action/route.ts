import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";
import { createResetToken } from "@/auth/services/passwordResetService";
import { sendPasswordResetEmail } from "@/auth/utils/email";

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "force_reset"]),
  requestId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { action, requestId } = parsed.data;

    const row = await query<{ id: string; email: string; status: string; user_id: string | null }>(
      `SELECT r.id, r.email, r.status, u.id as user_id
       FROM password_recovery_requests r
       LEFT JOIN users u ON lower(u.email) = lower(r.email)
       WHERE r.id = $1`,
      [requestId]
    );
    const rec = row.rows[0];
    if (!rec) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "reject") {
      await query(
        `UPDATE password_recovery_requests SET status = 'rejected' WHERE id = $1`,
        [requestId]
      );
      return NextResponse.json({ ok: true, message: "Request rejected" });
    }

    if (action === "approve" || action === "force_reset") {
      if (!rec.user_id) {
        return NextResponse.json(
          { error: "No user account found for this email. Cannot send reset link." },
          { status: 400 }
        );
      }
      const token = await createResetToken(rec.user_id);
      const origin = new URL(request.url).origin;
      const resetLink = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(rec.email, resetLink);
      await query(
        `UPDATE password_recovery_requests SET status = 'approved' WHERE id = $1`,
        [requestId]
      );
      return NextResponse.json({
        ok: true,
        message: "Reset link sent to user email.",
        resetLink: action === "force_reset" ? resetLink : undefined,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
