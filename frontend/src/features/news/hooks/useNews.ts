'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSocketStore } from '@/shared/store/socketStore';
import { newsService, News } from '@/features/news/services/newsService';

export function useNews(category?: string) {
  const { socket } = useSocketStore();
  const [realtimeNews, setRealtimeNews] = useState<News[]>([]);

  const { data: news, isLoading, refetch } = useQuery({
    queryKey: ['news', category],
    queryFn: () => newsService.getNews(category),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // Clear realtime news when category changes to prevent cross-category leakage
  useEffect(() => {
    setRealtimeNews([]);
  }, [category]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNews = (data: News) => {
      // Only include news for the current category if specified
      if (category && data.category !== category) return;
      setRealtimeNews((prev) => {
        // Prevent duplicates
        if (prev.some(item => item.id === data.id)) return prev;
        return [data, ...prev];
      });
    };

    socket.on('news:new', handleNewNews);

    return () => {
      socket.off('news:new', handleNewNews);
    };
  }, [socket, category]);

  const clearRealtimeNews = () => {
    setRealtimeNews([]);
    refetch();
  };

  return {
    news,
    isLoading: isLoading && !news, // Only show true loading if we have no data at all (including previous)
    realtimeNews,
    clearRealtimeNews,
  };
}
