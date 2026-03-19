"use client";

import { usePathname } from "next/navigation";
import { InteractiveBackground } from "./InteractiveBackground";

/**
 * Renders the interactive background with no floating icons on auth pages
 * (login, register, forgot-password, reset-password) so the ACO logo and
 * other decorative icons do not appear behind the auth panel.
 *
 * Also hides the grid on /circles and /circles/[slug] pages as requested.
 */
export function AuthAwareBackground() {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password");

  const isCirclesPage = pathname === "/circles" || pathname?.startsWith("/circles/");
  const isDropsPage = pathname === "/drops";

  return (
    <InteractiveBackground
      maxIcons={isAuthPage || isCirclesPage || isDropsPage ? 0 : undefined}
      hideGrid={isCirclesPage || isDropsPage}
    />
  );
}
