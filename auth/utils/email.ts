/**
 * Email sending for auth (password reset, etc.).
 * Wire to your provider (Resend, SendGrid, etc.) via env.
 */

/**
 * Send password reset link to user. No-op if no email provider configured.
 * In production set RESEND_API_KEY or similar and implement.
 */
export async function sendPasswordResetEmail(
  _email: string,
  resetLink: string
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[dev] Password reset link:", resetLink);
  }
  // TODO: integrate Resend/SendGrid when configured
}
