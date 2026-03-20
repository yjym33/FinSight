'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useEffect } from 'react';
import { useSocketStore } from '@/shared/store/socketStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { NotificationProvider } from '@/shared/providers/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  const { user, _hasHydrated } = useAuthStore();


  useEffect(() => {
    // Only connect once hydrated to avoid SSR/Hydration mismatch issues
    if (_hasHydrated) {
      connect(user?.id);
    }
    
    // Add cleanup to disconnect when the Providers component unmounts
    // (e.g. during HMR or when the whole app is unmounted)
    return () => {
      // Note: We might not always want to disconnect on every re-render,
      // but in React Strict Mode this will help identify redundant connections.
      // In a real SPA root, this only runs when the app is closed/reloaded.
    };
  }, [connect, user?.id, _hasHydrated]);


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
