"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CircleAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
}

function gradientForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const palette = [
    "from-violet-500 to-violet-600",
    "from-emerald-500 to-teal-500",
    "from-violet-500 to-fuchsia-500",
    "from-rose-500 to-fuchsia-500",
    "from-amber-500 to-orange-500",
  ];
  const idx = Math.abs(hash) % palette.length;
  return palette[idx]!;
}

export function CircleAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: CircleAvatarProps) {
  const initials = getInitials(name);

  const dimensionClasses =
    size === "lg"
      ? "h-24 w-24 sm:h-[96px] sm:w-[96px]"
      : size === "sm"
      ? "h-10 w-10 sm:h-12 sm:w-12"
      : "h-14 w-14 sm:h-16 sm:w-16";

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden flex items-center justify-center text-white font-semibold text-base sm:text-lg",
        "bg-gradient-to-br",
        gradientForName(name),
        dimensionClasses,
        className
      )}
      aria-label={name}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

