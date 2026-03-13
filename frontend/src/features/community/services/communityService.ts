import api from '@/shared/api/api';

export interface StockComment {
  id: number;
  stockCode: string;
  nickname: string;
  content: string;
  createdAt: string;
}

export const communityService = {
  getComments: async (stockCode: string, limit = 50): Promise<StockComment[]> => {
    const response = await api.get(`/community/stocks/${stockCode}/comments`, {
      params: { limit },
    });
    return response.data;
  },

  postComment: async (stockCode: string, content: string): Promise<StockComment> => {
    const response = await api.post('/community/comments', {
      stockCode,
      content,
    });
    return response.data;
  },
};
