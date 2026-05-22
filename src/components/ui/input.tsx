import * as React from "react";
import { cn } from "@/lib/utils";

// A3 spec: 48px tall, 8px radius, 1px #E5E7EB border, #2C3038 text,
// #8A919C placeholder, focus → emerald border + emerald 3px ring.
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-md border border-input bg-card px-4 py-3 text-sm leading-[22px] text-foreground shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-a3-fog focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
