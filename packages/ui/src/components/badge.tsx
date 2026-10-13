import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex rounded-md border border-border bg-slate-50 px-2 py-1 text-xs font-semibold leading-tight", className)} {...props} />;
}
