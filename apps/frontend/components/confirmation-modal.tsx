"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@support-hub/ui";
import { useConfirmationModalStore } from "../lib/confirmation-modal-store";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  error?: string;
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
  error,
  onCancel,
  onConfirm
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !isLoading) onCancel(); }}>
      <DialogContent className="gap-0">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-error-surface text-error">
            {icon ?? <AlertTriangle size={18} />}
          </span>
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mt-1">{message}</DialogDescription>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-error-muted">{error}</p>}
        <DialogFooter className="mt-5">
          <Button
            className="h-9 border-slate-200 bg-white px-4 text-sm text-slate-900"
            disabled={isLoading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            className="h-9 bg-error px-4 text-sm text-white hover:bg-error-muted"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? "Please wait..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GlobalConfirmationModal() {
  const { confirmation, isLoading, cancelConfirmation, confirm } = useConfirmationModalStore();
  if (!confirmation) return null;
  return <ConfirmationModal {...confirmation} open isLoading={isLoading} onCancel={cancelConfirmation} onConfirm={confirm} />;
}
