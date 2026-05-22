import * as React from "react";
import { cn } from "@/lib/utils";

// A3 spec: 8px radius, 1px #E5E7EB, 120px min height, emerald focus ring.
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-md border border-input bg-card px-4 py-3 text-sm leading-[22px] text-foreground placeholder:text-a3-fog transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
