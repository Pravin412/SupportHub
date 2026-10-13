import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Button({
  className,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn("inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold shadow-sm transition-colors enabled:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  );
}
