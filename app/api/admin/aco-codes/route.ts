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

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const res = await query<AcoCodeRow>(
      "SELECT id, code, role, uses_limit, uses_count, expires_at, disabled, created_by, created_at FROM aco_codes ORDER BY created_at DESC LIMIT 200"
    );
    return NextResponse.json({ codes: res.rows });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}

const createSchema = z.object({
  code: z.string().min(1).max(80),
  role: z.enum(["user", "tester", "developer", "partner"]),
  uses_limit: z.number().int().min(0).default(0),
  expires_at: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin({ requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { code, role, uses_limit, expires_at } = parsed.data;
    const trimmedCode = code.trim();
    await query(
      "INSERT INTO aco_codes (code, role, uses_limit, expires_at, created_by) VALUES ($1, $2, $3, $4, $5)",
      [trimmedCode, role, uses_limit, expires_at ?? null, auth.admin.sub]
    );

    const row = await query<AcoCodeRow>(
      "SELECT id, code, role, uses_limit, uses_count, expires_at, disabled, created_by, created_at FROM aco_codes WHERE code = $1",
      [trimmedCode]
    );
    const r = row.rows[0];
    return NextResponse.json({ code: r ?? null });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    const err = e as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json({ error: "A code with this value already exists." }, { status: 409 });
    }
    throw e;
  }
}
