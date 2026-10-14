import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
