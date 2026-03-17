import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-2xl border border-violet-200/80 bg-white/80 px-4 text-violet-950 placeholder:text-violet-400 shadow-soft backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-white/15",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

