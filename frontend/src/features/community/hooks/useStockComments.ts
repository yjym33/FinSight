import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService, StockComment } from '../services/communityService';
import { useSocketStore } from '@/shared/store/socketStore';

export function useStockComments(stockCode: string) {
  const queryClient = useQueryClient();
  const socket = useSocketStore((state) => state.socket);
  const [liveComments, setLiveComments] = useState<StockComment[]>([]);

  const { data: initialComments, isLoading } = useQuery({
    queryKey: ['stock-comments', stockCode],
    queryFn: () => communityService.getComments(stockCode),
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    if (initialComments) {
      setLiveComments(initialComments);
    }
  }, [initialComments]);

  const handleNewComment = useCallback((newComment: StockComment) => {
    if (newComment.stockCode === stockCode) {
      setLiveComments((prev) => [newComment, ...prev].slice(0, 100)); // Keep last 100
    }
  }, [stockCode]);

  useEffect(() => {
    if (!socket) return;

    socket.on('stock:comment:new', handleNewComment);

    return () => {
      socket.off('stock:comment:new', handleNewComment);
    };
  }, [socket, handleNewComment]);

  const postMutation = useMutation({
    mutationFn: (content: string) => communityService.postComment(stockCode, content),
    onSuccess: () => {
      // We don't necessarily need to refetch because it's broadcast via socket,
      // but it helps ensure consistency.
      queryClient.invalidateQueries({ queryKey: ['stock-comments', stockCode] });
    },
  });

  return {
    comments: liveComments,
    isLoading,
    postComment: postMutation.mutate,
    isPosting: postMutation.isPending,
  };
}
