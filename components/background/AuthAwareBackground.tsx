"use client";

import { usePathname } from "next/navigation";
import { InteractiveBackground } from "./InteractiveBackground";

/**
 * Renders the interactive background with no floating icons on auth pages
 * (login, register, forgot-password, reset-password) so the ACO logo and
 * other decorative icons do not appear behind the auth panel.
 */
export function AuthAwareBackground() {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password");
  return <InteractiveBackground maxIcons={isAuthPage ? 0 : undefined} />;
}
