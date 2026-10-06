import { create } from "zustand";

type SidebarState = {
  sidebarOpen: boolean;
  setSidebar: (open: boolean) => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: false,
  setSidebar: sidebarOpen => set({ sidebarOpen })
}));
