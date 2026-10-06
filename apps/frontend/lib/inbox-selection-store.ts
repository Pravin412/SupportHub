import { create } from "zustand";

type InboxSelectionState = {
  selectedProjectId?: string;
  selectedConversationId?: string;
  setProject: (id: string) => void;
  setConversation: (id?: string) => void;
  resetInboxSelection: () => void;
};

export const useInboxSelectionStore = create<InboxSelectionState>((set) => ({
  setProject: selectedProjectId => set({ selectedProjectId, selectedConversationId: undefined }),
  setConversation: selectedConversationId => set({ selectedConversationId }),
  resetInboxSelection: () => set({ selectedProjectId: undefined, selectedConversationId: undefined })
}));
