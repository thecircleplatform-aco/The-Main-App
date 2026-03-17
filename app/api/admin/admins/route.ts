import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/database/db";
import { configErrorResponse } from "@/config/configError";
import { requireAdmin } from "@/services/admin";
import { hashPassword } from "@/services/auth";

type AdminRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const res = await query<AdminRow>(
      `select id, email, role, created_at from admin_users order by created_at asc`
    );
    return NextResponse.json({ admins: res.rows });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

const addAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["owner", "admin", "viewer"]),
});

export async function POST(req: Request) {
  const auth = await requireAdmin({ requireOwner: true });
  if (auth instanceof NextResponse) return auth;

  const json = await req.json().catch(() => null);
  const parsed = addAdminSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  const { email, password, role } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);

    await query(
      `
      insert into users (email, name, password_hash)
      values ($1, $2, $3)
      on conflict (email) do update
      set password_hash = excluded.password_hash
      `,
      [email, `Admin (${role})`, passwordHash]
    );

    const res = await query(
      `
      insert into admin_users (email, role)
      values ($1, $2)
      on conflict (email) do update set role = excluded.role
      returning id, email, role, created_at
      `,
      [email, role]
    );

    return NextResponse.json({ admin: res.rows[0] });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add admin" },
      { status: 500 }
    );
  }
}
