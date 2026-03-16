'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSocketStore } from '@/shared/store/socketStore';
import { newsService, News } from '@/features/news/services/newsService';

export function useNews(category?: string, query?: string, fundamentalOnly: boolean = false) {
  const { socket } = useSocketStore();
  const [realtimeNews, setRealtimeNews] = useState<News[]>([]);

  const { data: news, isLoading, refetch } = useQuery({
    queryKey: ['news', category, query],
    queryFn: () => newsService.getNews(category, 50, query),
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

  // Merge, deduplicate, and filter news
  const displayNews = useMemo(() => {
    let allNews = [...realtimeNews, ...(news || [])];
    const seenTitles = new Set<string>();
    
    // Noise/Price keywords to exclude in fundamental mode
    const noiseKeywords = [
      '상승', '하락', '급등', '급락', '폭등', '폭락', '강세', '약세', 
      '52주', '신고가', '신저가', '특징주', '거래량', '시황', '증시요약'
    ];
    
    // Positive fundamental keywords to prioritize
    const fundamentalKeywords = [
      '공시', '수주', '계약', 'MOU', '협약', '인수', '합병', '진출', '투자', '출시', '특허', '기술', '사업'
    ];

    return allNews.filter((item) => {
      if (!item.title) return true;
      
      const title = item.title.trim().replace(/\s+/g, ' ');
      
      // 1. Deduplication by title
      if (seenTitles.has(title)) return false;
      seenTitles.add(title);
      
      // 2. Fundamental Filter
      if (fundamentalOnly) {
        // If it contains price noise AND doesn't have a strong fundamental keyword, filter it out
        const hasNoise = noiseKeywords.some(key => title.includes(key));
        const hasFundamental = fundamentalKeywords.some(key => title.includes(key));
        
        if (hasNoise && !hasFundamental) return false;
        
        // Strategy: Must contain at least one fundamental keyword OR not be a price alert
        // The above logic is a good balance.
      }
      
      return true;
    });
  }, [news, realtimeNews, fundamentalOnly]);

  return {
    news: displayNews,
    isLoading: isLoading && !news,
    realtimeNews,
    clearRealtimeNews,
  };
}
