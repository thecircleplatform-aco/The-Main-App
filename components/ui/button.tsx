import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition will-change-transform focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-glow hover:from-violet-700 hover:to-violet-600 active:scale-[0.99] focus-visible:ring-violet-400 dark:[background-image:none] dark:bg-white/15 dark:text-white dark:hover:bg-white/20 dark:focus-visible:ring-white/20",
        ghost:
          "bg-transparent text-violet-700 hover:text-violet-900 hover:bg-violet-50 active:scale-[0.99] focus-visible:ring-violet-300 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white/20",
      },
      size: {
        md: "h-11 px-5",
        lg: "h-12 px-6 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

