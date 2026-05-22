"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// A3 Brands button system.
// - default (Primary CTA): emerald fill on charcoal text, pill radius (50px),
//   emerald shadow, 14px/600 Sora, hover dims to 85% opacity.
// - secondary (Nav): transparent, charcoal text, hover → emerald + underline.
// - ghost (Tertiary): emerald text on transparent, hover → soft emerald wash.
// - outline: charcoal border, hover lifts to subtle gray.
// - destructive: reserved for hard deletes.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-[0.015em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground rounded-pill shadow-emerald hover:opacity-85 hover:shadow-emerald-strong active:opacity-70",
        secondary:
          "bg-transparent text-foreground font-normal hover:text-primary hover:underline underline-offset-[6px] decoration-2 decoration-primary",
        ghost:
          "bg-transparent text-primary rounded-md hover:bg-a3-emerald-soft",
        outline:
          "border border-input bg-transparent text-foreground rounded-md hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground rounded-md hover:opacity-90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",          // 48px tall — A3 spec
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-[15px]",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
export { buttonVariants };
