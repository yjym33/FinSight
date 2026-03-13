import api from '@/shared/api/api';

export interface News {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  relatedStockCode?: string;
  category: string;
}

export const newsService = {
  getNews: async (category?: string, limit = 50): Promise<News[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    const response = await api.get(`/news?${params.toString()}`);
    return response.data;
  },

  getNewsById: async (id: string): Promise<News> => {
    const response = await api.get(`/news/${id}`);
    return response.data;
  },

  getNewsByStock: async (stockCode: string, stockName?: string): Promise<News[]> => {
    let url = `/news/stock/${stockCode}`;
    if (stockName) {
      url += `?stockName=${encodeURIComponent(stockName)}`;
    }
    const response = await api.get(url);
    return response.data;
  },
};
