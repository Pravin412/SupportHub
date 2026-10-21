import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors enabled:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-border bg-white shadow-sm",
        primary: "border border-brand bg-brand text-white shadow-sm hover:bg-brand/90",
        outline: "border border-brand-border bg-white text-brand shadow-sm hover:bg-brand-soft",
        ghost: "border border-transparent bg-transparent text-slate-700 shadow-none hover:bg-slate-100 enabled:hover:brightness-100",
        link: "h-auto border-0 bg-transparent p-0 text-brand shadow-none underline-offset-4 hover:underline enabled:hover:brightness-100"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "h-9 w-9 px-0",
        none: "h-auto px-0"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    label?: React.ReactNode;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, label, children, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children ?? label}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
