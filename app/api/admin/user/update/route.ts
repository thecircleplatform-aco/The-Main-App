import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { hashPassword } from "@/services/auth";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";
import { getClientIp } from "@/lib/request-utils";

const bodySchema = z.object({
  userId: z.string().uuid(),
  username: z.string().max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phone_login_disabled: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { userId, username, email, password, phone_login_disabled } = parsed.data;

    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (username !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      params.push(username.trim() || null);
    }
    if (email !== undefined) {
      const normalized = email.trim().toLowerCase();
      const conflict = await query(
        "SELECT id FROM users WHERE lower(email) = $1 AND id != $2",
        [normalized, userId]
      );
      if (conflict.rows.length > 0) {
        return NextResponse.json(
          { error: "Email already in use by another user" },
          { status: 409 }
        );
      }
      updates.push(`email = $${paramIdx++}`);
      params.push(normalized);
    }
    if (password !== undefined) {
      const hashed = await hashPassword(password);
      updates.push(`password_hash = $${paramIdx++}`);
      params.push(hashed);
    }
    if (phone_login_disabled !== undefined) {
      updates.push(`phone_login_disabled = $${paramIdx++}`);
      params.push(phone_login_disabled);
    }

    if (updates.length === 0) {
      return NextResponse.json({ ok: true });
    }

    params.push(userId);
    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIdx}`,
      params
    );

    const ip = getClientIp(request);
    await query(
      `INSERT INTO admin_action_logs (admin_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auth.admin.sub,
        "user_update",
        "user",
        userId,
        JSON.stringify({ fields: Object.keys(parsed.data).filter((k) => k !== "userId") }),
        ip,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
