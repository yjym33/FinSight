import { create } from 'zustand';

type SidebarTab = 'watchlist' | 'recent' | 'realtime' | 'portfolio' | null;

interface GlobalSidebarState {
  isOpen: boolean;
  activeTab: SidebarTab;
  setOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: SidebarTab) => void;
  toggleTab: (tab: SidebarTab) => void;
  close: () => void;
}

export const useGlobalSidebarStore = create<GlobalSidebarState>((set) => ({
  isOpen: false,
  activeTab: null,
  setOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab, isOpen: activeTab !== null }),
  toggleTab: (tab) => set((state) => {
    if (state.activeTab === tab) {
      return { activeTab: null, isOpen: false };
    }
    return { activeTab: tab, isOpen: true };
  }),
  close: () => set({ isOpen: false, activeTab: null }),
}));
