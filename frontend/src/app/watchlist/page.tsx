'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSidebarStore } from '@/shared/store/sidebarStore';

export default function WatchlistPage() {
  const router = useRouter();
  const { toggleTab } = useGlobalSidebarStore();

  useEffect(() => {
    // Open the sidebar automatically and go back to dashboard
    toggleTab('watchlist');
    router.replace('/dashboard');
  }, [toggleTab, router]);

  return null;
}
