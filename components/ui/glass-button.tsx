import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export type GlassButtonProps = ButtonProps;

/**
 * Glass-styled button that composes the base Button component
 * with stronger glassmorphism accents.
 */
export const GlassButton = React.forwardRef<
  HTMLButtonElement,
  GlassButtonProps
>(({ className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn(
        "rounded-2xl bg-white/12 text-white shadow-glow hover:bg-white/18 active:scale-[0.99]",
        className
      )}
      {...props}
    />
  );
});

GlassButton.displayName = "GlassButton";

