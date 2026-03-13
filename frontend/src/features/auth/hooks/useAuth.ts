import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const { accessToken, user, logout } = useAuthStore();

  useEffect(() => {
    if (requireAuth && !accessToken) {
      router.push('/login');
    }
  }, [accessToken, requireAuth, router]);

  return {
    isAuthenticated: !!accessToken,
    user,
    logout: () => {
      logout();
      router.push('/login');
    },
  };
}
