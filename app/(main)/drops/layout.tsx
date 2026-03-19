import type { ReactNode } from "react";

/**
 * Drops gets a full-bleed layout: no horizontal padding from main,
 * so the feed and video can use the full viewport width and height.
 */
export default function DropsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-[calc(100dvh-7rem)] w-screen max-w-none overflow-x-hidden bg-[#0b0f19]"
      style={{
        // Force true full-bleed width even if a parent constrains layout.
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      {children}
    </div>
  );
}
