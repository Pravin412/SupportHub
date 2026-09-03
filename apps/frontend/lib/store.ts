import { create } from "zustand";

export type Toast = {
  id: string;
  type?: "success" | "error" | "info";
  message: string;
};

type UiState = {
  selectedProjectId?: string;
  selectedConversationId?: string;
  sidebarOpen: boolean;
  toasts: Toast[];
  setProject: (id: string) => void;
  setConversation: (id?: string) => void;
  resetInboxSelection: () => void;
  setSidebar: (open: boolean) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toasts: [],
  setProject: (selectedProjectId) => set({ selectedProjectId, selectedConversationId: undefined }),
  setConversation: (selectedConversationId) => set({ selectedConversationId }),
  resetInboxSelection: () => set({ selectedProjectId: undefined, selectedConversationId: undefined }),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  showToast: (message, type = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id)
      }));
    }, 3500);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
}));
