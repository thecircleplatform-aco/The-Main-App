import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { configErrorResponse } from "@/lib/configError";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e: { message: string }) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const res = await query<{
      id: string;
      email: string;
      name: string | null;
      password_hash: string | null;
    }>(
      "SELECT id, email, name, password_hash FROM users WHERE lower(email) = $1",
      [normalizedEmail]
    );
    const row = res.rows[0];
    if (!row) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!row.password_hash) {
      return NextResponse.json(
        { error: "This account has no password set. Use a different login method or reset your account." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
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
