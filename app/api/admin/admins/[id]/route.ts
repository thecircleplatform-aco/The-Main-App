import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { configErrorResponse } from "@/config/configError";
import { requireAdmin } from "@/services/admin";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  role: z.enum(["owner", "admin", "viewer"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin({ requireOwner: true });
  if (auth instanceof NextResponse) return auth;

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid admin id" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success || !parsedBody.data?.role) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const id = parsedParams.data.id;
  const { role } = parsedBody.data;

  try {
    const current = await query<{ role: string }>(
      `select role from admin_users where id = $1`,
      [id]
    );
    if (current.rows.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    if (current.rows[0].role === "owner" && role !== "owner") {
      const owners = await query(
        `select count(*)::int as n from admin_users where role = 'owner'`
      );
      if (owners.rows[0]?.n <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last owner. Promote another admin first." },
          { status: 400 }
        );
      }
    }

    await query(
      `update admin_users set role = $1 where id = $2`,
      [role, id]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update admin" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin({ requireOwner: true });
  if (auth instanceof NextResponse) return auth;

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid admin id" }, { status: 400 });
  }

  const id = parsedParams.data.id;

  try {
    const res = await query(
      `delete from admin_users where id = $1 and role != 'owner' returning id`,
      [id]
    );

    if (res.rowCount === 0) {
      const checkOwner = await query(
        `select id from admin_users where id = $1 and role = 'owner'`,
        [id]
      );
      if (checkOwner.rows.length > 0) {
        return NextResponse.json(
          { error: "Cannot remove the last owner. Promote another admin first." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to remove admin" },
      { status: 500 }
    );
  }
}
