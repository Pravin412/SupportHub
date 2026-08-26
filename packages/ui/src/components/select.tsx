import type { SelectHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
