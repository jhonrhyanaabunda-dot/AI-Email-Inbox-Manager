import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// A3 Brands badges:
// - dealership: solid emerald, white text, 4px radius, 10px / 700 / uppercase / 0.05em
// - status: emerald-tinted background + emerald border + emerald text (11px / 600)
// - outline: stone border, charcoal text
// - critical/warning: semantic only when business-critical (escalations, errors)
const badgeVariants = cva(
  "inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-[0.05em] leading-[14px]",
        status:
          "bg-a3-emerald-soft text-primary border border-primary px-2.5 py-0.5 rounded-sm text-[11px] font-semibold leading-4",
        secondary:
          "bg-muted text-foreground px-2.5 py-0.5 rounded-sm text-[11px] font-medium",
        outline:
          "border border-border text-muted-foreground px-2.5 py-0.5 rounded-sm text-[11px] font-medium",
        success:
          "bg-a3-emerald-soft text-primary border border-primary/40 px-2.5 py-0.5 rounded-sm text-[11px] font-semibold",
        warning:
          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-sm text-[11px] font-semibold",
        critical:
          "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/40 px-2.5 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider",
        destructive:
          "bg-destructive text-destructive-foreground px-2.5 py-0.5 rounded-sm text-[11px] font-semibold",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
