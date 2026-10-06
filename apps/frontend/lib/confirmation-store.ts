import { create } from "zustand";
import type { ReactNode } from "react";

type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  icon?: ReactNode;
  onConfirm: () => void | Promise<unknown>;
};

type ConfirmationState = {
  confirmation: Confirmation | null;
  isLoading: boolean;
  error?: string;
  openConfirmation: (confirmation: Confirmation) => void;
  cancelConfirmation: () => void;
  confirm: () => Promise<void>;
};

export const useConfirmationStore = create<ConfirmationState>((set, get) => ({
  confirmation: null,
  isLoading: false,
  openConfirmation: (confirmation) => {
    if (!get().confirmation) set({ confirmation, error: undefined });
  },
  cancelConfirmation: () => {
    if (!get().isLoading) set({ confirmation: null, error: undefined });
  },
  confirm: async () => {
    const { confirmation, isLoading } = get();
    if (!confirmation || isLoading) return;
    set({ isLoading: true, error: undefined });
    try {
      await confirmation.onConfirm();
      set({ confirmation: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "The action failed. Please try again." });
    } finally {
      set({ isLoading: false });
    }
  }
}));
