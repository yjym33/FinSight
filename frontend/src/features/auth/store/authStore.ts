import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nickname: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      _hasHydrated: false,
      setAuth: (token, user) => set({ accessToken: token, user }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
