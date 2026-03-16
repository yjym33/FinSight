import api from '@/shared/api/api';

export const stocksService = {
  getStockPrice: async (stockCode: string) => {
    const response = await api.get(`/stocks/${stockCode}/price`);
    return response.data;
  },
  getChartData: async (stockCode: string, period: '1D' | '1W' | '1M' | '1Y' = '1D') => {
    const response = await api.get(`/stocks/${stockCode}/chart`, { params: { period } });
    return response.data;
  },
  getStockAnalysis: async (stockCode: string) => {
    const response = await api.get<{ reason: string; points: string[]; score: number }>(`/stocks/${stockCode}/analysis`);
    return response.data;
  },
  getRanking: async (market: '전체' | '코스피' | '코스닥' = '전체', type: 'volume' | 'gainers' | 'losers' = 'volume') => {
    const marketCode = market === '코스피' ? 'J' : market === '코스닥' ? 'K' : 'J';
    const response = await api.get('/stocks/ranking/volume', { params: { market: marketCode, type } });
    return response.data;
  },
  getInvestorTrend: async (stockCode: string) => {
    const response = await api.get<{
      retail: number;
      foreigner: number;
      institution: number;
      date: string;
      raw: any;
    } | null>(`/stocks/${stockCode}/investors`);
    return response.data;
  },
  compareStocks: async (codes: string[]) => {
    const response = await api.get('/stocks/compare', { params: { codes: codes.join(',') } });
    return response.data;
  },
  getThemes: async () => {
    const response = await api.get<{
      theme: string;
      reason: string;
      stocks: string[];
      strength: number;
    }[]>('/stocks/themes');
    return response.data;
  },
};
