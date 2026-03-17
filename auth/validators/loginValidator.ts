import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  deviceId: z.string().optional(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export function validateLoginBody(body: unknown): { success: true; data: LoginBody } | { success: false; message: string } {
  const parsed = loginBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join("; ");
    return { success: false, message: msg };
  }
  return { success: true, data: parsed.data };
}
