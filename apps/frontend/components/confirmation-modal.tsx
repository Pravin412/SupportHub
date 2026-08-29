"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@support-hub/ui";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  icon,
  isLoading = false,
  onCancel,
  onConfirm
}: ConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-red-50 text-red-600">
            {icon ?? <AlertTriangle size={18} />}
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-muted">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            className="h-9 border-slate-200 bg-white px-4 text-sm text-slate-900"
            disabled={isLoading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            className="h-9 bg-red-600 px-4 text-sm text-white hover:bg-red-700"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
