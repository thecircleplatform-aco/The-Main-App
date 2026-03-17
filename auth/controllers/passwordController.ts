/**
 * Password controller. Placeholder for forgot-password and reset-password flows.
 */

import { NextResponse } from "next/server";

/** Request password reset (send email with token). TODO: implement. */
export async function handleForgotPassword(_request: Request): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Password reset not yet implemented." },
    { status: 501 }
  );
}

/** Reset password with token from email. TODO: implement. */
export async function handleResetPassword(_request: Request): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Password reset not yet implemented." },
    { status: 501 }
  );
}
