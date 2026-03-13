'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function Home() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [accessToken, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-xl">Loading...</div>
    </main>
  );
}
