'use client';

import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/api/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useRouter } from 'next/navigation';

interface WatchlistStarProps {
  stockCode: string;
  className?: string;
  iconClassName?: string;
}

export function WatchlistStar({ stockCode, className, iconClassName }: WatchlistStarProps) {
  const queryClient = useQueryClient();

  // Try to use full watchlist cache if available
  const fullWatchlist = queryClient.getQueryData<any[]>(['watchlist']);

  const { accessToken, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const { data: watchlistStatus } = useQuery({
    queryKey: ['watchlist', 'status', stockCode],
    queryFn: async () => {
      const response = await api.get(`/watchlist/${stockCode}/check`);
      return response.data;
    },
    enabled: _hasHydrated && !!accessToken,
    initialData: fullWatchlist && Array.isArray(fullWatchlist)
      ? { isInWatchlist: fullWatchlist.some((item: any) => item.stockCode === stockCode) }
      : undefined,
  });

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (!_hasHydrated || !accessToken) {
        alert('관심종목을 추가하려면 로그인이 필요합니다.');
        router.push('/login');
        throw new Error('Unauthorized');
      }

      if (watchlistStatus?.isInWatchlist) {
        return api.delete(`/watchlist/${stockCode}`);
      } else {
        return api.post(`/watchlist/${stockCode}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'status', stockCode] });
    },
    onError: (error: any) => {
      if (error.message !== 'Unauthorized') {
        console.error('Failed to toggle watchlist:', error);
      }
    }
  });

  const isInWatchlist = watchlistStatus?.isInWatchlist;

  return (
    <button 
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWatchlist.mutate();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      disabled={toggleWatchlist.isPending}
      className={cn(
        "relative z-10 p-2 rounded-full transition-all hover:bg-gray-100 flex items-center justify-center",
        isInWatchlist ? "bg-yellow-50 hover:bg-yellow-100" : "",
        toggleWatchlist.isPending ? "opacity-50 cursor-wait" : "",
        className
      )}
      title={isInWatchlist ? "관심 종목에서 제거" : "관심 종목으로 추가"}
    >
      <Star className={cn(
        "h-5 w-5 transition-all",
        isInWatchlist ? "text-yellow-400 fill-yellow-400" : "text-toss-text-placeholder group-hover:text-toss-text-secondary",
        toggleWatchlist.isPending ? "animate-pulse" : "",
        iconClassName
      )} />
    </button>
  );
}
