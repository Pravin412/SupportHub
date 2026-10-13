"use client";
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { ToastProps } from "../components/ui/Toast";

type ToastNotification = ToastProps & { id: string; description: ReactNode };
let notifications: ToastNotification[] = [];
const emptyNotifications: ToastNotification[] = [];
const listeners = new Set<() => void>();
let nextId = 0;
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

function publish() {
  listeners.forEach(listener => listener());
}

function dismiss(id: string) {
  clearTimeout(dismissTimers.get(id));
  dismissTimers.delete(id);
  notifications = notifications.filter(notification => notification.id !== id);
  publish();
}

export function toast(options: ToastProps & { description: ReactNode }) {
  const existing = notifications.find(notification =>
    notification.description === options.description && notification.variant === options.variant
  );
  if (existing) return { id: existing.id, dismiss: () => dismiss(existing.id) };
  const id = `toast-${++nextId}`;
  const duration = options.duration ?? 3000;
  function handleOpenChange(open: boolean) {
    options.onOpenChange?.(open);
    if (!open) dismiss(id);
  }
  notifications = [...notifications, { ...options, duration, id, open: true, onOpenChange: handleOpenChange }];
  if (Number.isFinite(duration)) {
    dismissTimers.set(id, setTimeout(() => dismiss(id), duration));
  }
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
