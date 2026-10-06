import { create } from "zustand";
import type { ReactNode } from "react";
import { displayToast } from "./display-toast";

type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  icon?: ReactNode;
  onConfirm: () => void | Promise<unknown>;
};

type ConfirmationModalState = {
  confirmation: Confirmation | null;
  isLoading: boolean;
  openConfirmation: (confirmation: Confirmation) => void;
  cancelConfirmation: () => void;
  confirm: () => Promise<void>;
};

export const useConfirmationModalStore = create<ConfirmationModalState>((set, get) => ({
  confirmation: null,
  isLoading: false,
  openConfirmation: (confirmation) => {
    if (!get().confirmation) set({ confirmation });
  },
  cancelConfirmation: () => {
    if (!get().isLoading) set({ confirmation: null });
  },
  confirm: async () => {
    const { confirmation, isLoading } = get();
    if (!confirmation || isLoading) return;
    set({ isLoading: true });
    try {
      await confirmation.onConfirm();
      set({ confirmation: null });
    } catch (error) {
      displayToast(error instanceof Error ? error.message : "The action failed. Please try again.", "destructive");
    } finally {
      set({ isLoading: false });
    }
  }
}));
