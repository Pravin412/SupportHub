import { toast } from "../hooks";
import type { ToastProps } from "../components/ui/Toast";

export function displayToast(message: string, variant: "warning" | "success" | "destructive", options?: Partial<ToastProps>) {
  const { className, duration, ...restOptions } = options ?? {};
  return toast({
    ...restOptions,
    duration: duration ?? 2000,
    description: message,
    variant,
    className: ["flex justify-center text-sm md:text-base font-medium font-sans", className].filter(Boolean).join(" ")
  });
}
