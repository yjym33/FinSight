'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useEffect } from 'react';
import { useSocketStore } from '@/shared/store/socketStore';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { NotificationProvider } from '@/shared/providers/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const connect = useSocketStore((state) => state.connect);

  useEffect(() => {
    connect();
  }, [connect]);

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
