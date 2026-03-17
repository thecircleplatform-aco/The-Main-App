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
        "rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-glow hover:from-violet-700 hover:to-cyan-600 active:scale-[0.99] dark:[background-image:none] dark:bg-white/12 dark:hover:bg-white/18",
        className
      )}
      {...props}
    />
  );
});

GlassButton.displayName = "GlassButton";

