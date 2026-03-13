import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentStock {
  code: string;
  name: string;
  market: string;
  timestamp: number;
}

interface RecentStocksState {
  recentStocks: RecentStock[];
  addRecentStock: (stock: Omit<RecentStock, 'timestamp'>) => void;
  removeRecentStock: (code: string) => void;
  clearRecentStocks: () => void;
}

export const useRecentStocksStore = create<RecentStocksState>()(
  persist(
    (set) => ({
      recentStocks: [],
      addRecentStock: (stock) => set((state) => {
        // Filter out if already exists and add to front with new timestamp
        const filtered = state.recentStocks.filter((s) => s.code !== stock.code);
        const updated = [{ ...stock, timestamp: Date.now() }, ...filtered];
        // Keep only top 20
        return { recentStocks: updated.slice(0, 20) };
      }),
      removeRecentStock: (code) => set((state) => ({
        recentStocks: state.recentStocks.filter((s) => s.code !== code)
      })),
      clearRecentStocks: () => set({ recentStocks: [] }),
    }),
    {
      name: 'recent-stocks-storage',
    }
  )
);
