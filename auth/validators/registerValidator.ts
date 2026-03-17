import { z } from "zod";
import { getPasswordStrength, MIN_STRENGTH_PERCENTAGE } from "@/auth/validators/passwordStrength";

export const registerBodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(120).optional(),
  deviceFingerprint: z.string().min(1).optional(),
  aco_code: z.string().max(120).optional(),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export function validateRegisterBody(body: unknown): { success: true; data: RegisterBody } | { success: false; message: string } {
  const parsed = registerBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join("; ");
    return { success: false, message: msg };
  }
  const { password } = parsed.data;
  const strength = getPasswordStrength(password);
  if (strength.percentage < MIN_STRENGTH_PERCENTAGE) {
    return {
      success: false,
      message: "Password is too weak. Please choose a stronger password.",
    };
  }
  return { success: true, data: parsed.data };
}
