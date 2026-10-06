"use client";
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { ToastProps } from "../components/ui/Toast";

type ToastNotification = ToastProps & { id: string; description: ReactNode };
let notifications: ToastNotification[] = [];
const emptyNotifications: ToastNotification[] = [];
const listeners = new Set<() => void>();
let nextId = 0;

function publish() {
  listeners.forEach(listener => listener());
}

function dismiss(id: string) {
  notifications = notifications.filter(notification => notification.id !== id);
  publish();
}

export function toast(options: ToastProps & { description: ReactNode }) {
  const id = `toast-${++nextId}`;
  function handleOpenChange(open: boolean) {
    options.onOpenChange?.(open);
    if (!open) dismiss(id);
  }
  notifications = [...notifications, { ...options, id, open: true, onOpenChange: handleOpenChange }];
  publish();
  return { id, dismiss: () => dismiss(id) };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useToast() {
  const toasts = useSyncExternalStore(subscribe, () => notifications, () => emptyNotifications);
  return { toasts, toast };
}
