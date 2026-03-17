import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { requireAdmin } from "@/services/admin";
import { configErrorResponse } from "@/config/configError";
import { ACO_ROLES } from "@/auth/services/acoCodeService";

type AcoCodeRow = {
  id: string;
  code: string;
  role: string;
  uses_limit: number;
  uses_count: number;
  expires_at: string | null;
  disabled: boolean;
  created_by: string | null;
  created_at: string;
};

function rowToJson(r: AcoCodeRow) {
  return {
    id: r.id,
    code: r.code,
    role: r.role,
    uses_limit: r.uses_limit,
    uses_count: r.uses_count,
    expires_at: r.expires_at,
    disabled: r.disabled,
    created_by: r.created_by,
    created_at: r.created_at,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const res = await query<AcoCodeRow>(
      `SELECT id, code, role, uses_limit, uses_count, expires_at, disabled, created_by, created_at
       FROM aco_codes WHERE id = $1`,
      [id]
    );
    const row = res.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }
    return NextResponse.json(rowToJson(row));
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

const updateSchema = z.object({
  code: z.string().min(1).max(80).optional(),
  role: z.enum(ACO_ROLES as unknown as [string, ...string[]]).optional(),
  uses_limit: z.number().int().min(0).optional(),
  expires_at: z.union([z.string(), z.null()]).optional(),
  disabled: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (parsed.data.code !== undefined) {
      updates.push(`code = $${i++}`);
      values.push(parsed.data.code.trim());
    }
    if (parsed.data.role !== undefined) {
      updates.push(`role = $${i++}`);
      values.push(parsed.data.role);
    }
    if (parsed.data.uses_limit !== undefined) {
      updates.push(`uses_limit = $${i++}`);
      values.push(parsed.data.uses_limit);
    }
    if (parsed.data.expires_at !== undefined) {
      updates.push(`expires_at = $${i++}`);
      values.push(parsed.data.expires_at);
    }
    if (parsed.data.disabled !== undefined) {
      updates.push(`disabled = $${i++}`);
      values.push(parsed.data.disabled);
    }

    if (updates.length === 0) {
      const res = await query<AcoCodeRow>(
        `SELECT id, code, role, uses_limit, uses_count, expires_at, disabled, created_by, created_at
         FROM aco_codes WHERE id = $1`,
        [id]
      );
      const row = res.rows[0];
      if (!row) return NextResponse.json({ error: "Code not found" }, { status: 404 });
      return NextResponse.json(rowToJson(row));
    }

    values.push(id);
    await query(
      `UPDATE aco_codes SET ${updates.join(", ")} WHERE id = $${i}`,
      values
    );

    const res = await query<AcoCodeRow>(
      `SELECT id, code, role, uses_limit, uses_count, expires_at, disabled, created_by, created_at
       FROM aco_codes WHERE id = $1`,
      [id]
    );
    const row = res.rows[0];
    if (!row) return NextResponse.json({ error: "Code not found" }, { status: 404 });
    return NextResponse.json(rowToJson(row));
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const res = await query(`DELETE FROM aco_codes WHERE id = $1 RETURNING id`, [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
