"use client";
import { useToast } from "../hooks";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastViewport } from "./ui/Toast";

export function Toaster() {
  const { toasts } = useToast();
  return (
    <ToastProvider>
      {toasts.map(({ id, description, ...props }) => (
        <Toast key={id} {...props}>
          <ToastDescription>{description}</ToastDescription>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
