import * as React from "react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "@/components/ui/input";

export type GlassInputProps = InputProps;

/**
 * Glass-styled input built on the base Input component.
 */
export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn(
          "rounded-2xl border-white/20 bg-white/6 shadow-soft backdrop-blur-2xl focus:ring-2 focus:ring-white/25",
          className
        )}
        {...props}
      />
    );
  }
);

GlassInput.displayName = "GlassInput";

