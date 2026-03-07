import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full resize-none rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/40 shadow-soft backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/15",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

