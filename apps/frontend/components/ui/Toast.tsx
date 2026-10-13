"use client";
import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export const ToastProvider = ToastPrimitives.Provider;

export const ToastViewport = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Viewport>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>>(
  ({ className, ...props }, ref) => <ToastPrimitives.Viewport ref={ref} {...props} className={cn("fixed inset-x-0 top-4 z-[100] mx-auto flex max-h-screen w-full max-w-md flex-col gap-2 p-4 outline-none", className)} />
);
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg border border-l-4 p-4 pr-14 shadow-md backdrop-blur-md transition-all duration-200 ease-out data-[state=closed]:opacity-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
  {
    variants: {
      variant: {
        default: "border-border border-l-slate-400 bg-white/95 text-primary",
        warning: "border-amber-200 border-l-amber-500 bg-amber-50/95 text-amber-950",
        success: "border-emerald-200 border-l-emerald-500 bg-emerald-50/95 text-emerald-950",
        destructive: "border-rose-200 border-l-rose-500 bg-rose-50/95 text-rose-950"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>>(
  ({ className, variant, ...props }, ref) => <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
);
Toast.displayName = ToastPrimitives.Root.displayName;

export const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Action>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>>(
  ({ className, ...props }, ref) => <ToastPrimitives.Action ref={ref} className={cn("inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-sm disabled:opacity-50", className)} {...props} />
);
ToastAction.displayName = ToastPrimitives.Action.displayName;

export const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Close>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>>(
  ({ className, ...props }, ref) => <ToastPrimitives.Close ref={ref} aria-label="Dismiss notification" title="Dismiss notification" className={cn("absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-md text-current opacity-60 transition-colors hover:bg-black/5 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px]", className)} {...props}><X size={16} /></ToastPrimitives.Close>
);
ToastClose.displayName = ToastPrimitives.Close.displayName;

export const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Title>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>>(
  ({ className, ...props }, ref) => <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
);
ToastTitle.displayName = ToastPrimitives.Title.displayName;

export const ToastDescription = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Description>, React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>>(
  ({ className, ...props }, ref) => <ToastPrimitives.Description ref={ref} className={cn("min-w-0 break-words text-sm font-medium leading-relaxed", className)} {...props} />
);
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
export type ToastActionElement = React.ReactElement<typeof ToastAction>;
