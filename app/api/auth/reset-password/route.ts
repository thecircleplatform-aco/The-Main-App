import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getValidResetToken,
  consumeResetToken,
  updateUserPassword,
} from "@/auth/services/passwordResetService";
import { getPasswordStrength, MIN_STRENGTH_PERCENTAGE } from "@/auth/validators/passwordStrength";

const bodySchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const strength = getPasswordStrength(password);
    if (strength.percentage < MIN_STRENGTH_PERCENTAGE) {
      return NextResponse.json(
        { error: "Password is too weak. Please choose a stronger password." },
        { status: 400 }
      );
    }

    const row = await getValidResetToken(token);
    if (!row) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    await updateUserPassword(row.user_id, password);
    await consumeResetToken(token);

    return NextResponse.json({
      message: "Password updated. You can now sign in with your new password.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
