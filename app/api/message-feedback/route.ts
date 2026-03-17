import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/services/auth";
import { query } from "@/database/db";

const bodySchema = z.object({
  messageId: z.string().min(1),
  feedbackType: z.enum(["helpful", "not_helpful"]),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { messageId, feedbackType } = parsed.data;

  try {
    await query(
      `INSERT INTO message_feedback (user_id, message_id, feedback_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, message_id) DO UPDATE
       SET feedback_type = EXCLUDED.feedback_type, created_at = now()`,
      [session.sub, messageId, feedbackType]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Table might not exist yet
    console.error("message_feedback insert error:", e);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
