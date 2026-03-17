"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const providerButtonClass = cn(
  "flex w-full max-w-full items-center gap-3 rounded-[14px] border border-gray-200 bg-gray-50/80 py-3.5 px-[18px] text-sm font-medium text-gray-800 shadow-soft backdrop-blur-xl",
  "hover:bg-gray-100/90 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
  "transition focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-white/25",
  "mb-3"
);

const iconContainerClass = "flex h-7 w-7 flex-shrink-0 items-center justify-center";
const iconSizeClass = "h-6 w-6"; // 24px × 24px

export type ProviderButtonProps = {
  /** Icon: React node (e.g. <Image> or <Smartphone />). Will be wrapped in 28×28 container and constrained to 24×24. */
  icon: React.ReactNode;
  text: string;
} & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
);

/**
 * Reusable provider button for login/signup: ACO, Google, GitHub, Phone.
 * Layout: icon (left), text (center), arrow (right). 28×28 icon container, 24×24 icon size.
 */
export function ProviderButton({ icon, text, ...rest }: ProviderButtonProps) {
  const content = (
    <>
      <span className={iconContainerClass}>
        <span className={cn("flex items-center justify-center", iconSizeClass)}>
          {icon}
        </span>
      </span>
      <span className="provider-text min-w-0 flex-1 text-center">{text}</span>
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-gray-500 dark:text-white/50">
        <ChevronRight className="h-5 w-5" aria-hidden />
      </span>
    </>
  );

  if ("href" in rest && rest.href) {
    return (
      <a href={rest.href} className={providerButtonClass}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={rest.onClick}
      className={providerButtonClass}
    >
      {content}
    </button>
  );
}

/** Pre-sized Next/Image for provider icons (24×24). Use inside ProviderButton. */
export function ProviderIconImage({
  src,
  alt = "",
  darkInvert = false,
}: {
  src: string;
  alt?: string;
  darkInvert?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className={cn("h-6 w-6", darkInvert && "dark:invert")}
    />
  );
}
