import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { configErrorResponse } from "@/lib/configError";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e: { message: string }) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE lower(email) = $1",
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const insert = await query<{ id: string; email: string; name: string | null }>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [normalizedEmail, name?.trim() || null, passwordHash]
    );
    const row = insert.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Registration failed." }, { status: 500 });
    }

    await createSession({
      sub: row.id,
      email: row.email,
      name: row.name,
    });

    return NextResponse.json({
      user: { id: row.id, email: row.email, name: row.name ?? undefined },
    });
  } catch (e) {
    const configRes = configErrorResponse(e);
    if (configRes) return configRes;
    throw e;
  }
}
