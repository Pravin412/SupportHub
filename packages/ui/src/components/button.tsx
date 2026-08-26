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
      className={cn("inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium", className)}
      {...props}
    />
  );
}
