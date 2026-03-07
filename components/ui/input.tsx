import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/40 shadow-soft backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/15",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

