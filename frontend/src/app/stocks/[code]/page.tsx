'use client';

import { useParams } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { stocksService } from '@/features/stocks/services/stocksService';
import { StockDetailHeader } from '@/features/stocks/components/StockDetailHeader';
import { StockChart } from '@/features/stocks/components/StockChart';
import { AIStockAnalysisCard } from '@/features/stocks/components/AIStockAnalysisCard';
import { StockNotificationCard } from '@/features/stocks/components/StockNotificationCard';
import { AIReasonBanner } from '@/features/stocks/components/AIReasonBanner';
import { newsService } from '@/features/news/services/newsService';
import { cn } from '@/shared/lib/utils';
import { FinancialHighlightsCard } from '@/features/stocks/components/FinancialHighlightsCard';
import { NewsCard } from '@/features/news/components/NewsCard';
import { useRecentStocksStore } from '@/features/stocks/store/recentStocksStore';
import { StockCommunity } from '@/features/community/components/StockCommunity';
import { InvestorTrendCard } from '@/features/stocks/components/InvestorTrendCard';

export default function StockDetailPage() {
  const params = useParams();
  const stockCode = params.code as string;
  const { stockPrices, subscribeStock } = useWebSocket();
  const [period, setPeriod] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');

  useEffect(() => {
    if (stockCode) {
      subscribeStock(stockCode);
    }
  }, [stockCode, subscribeStock]);

  const { data: stockInfo, isLoading: isInfoLoading } = useQuery({
    queryKey: ['stocks', 'price', stockCode],
    queryFn: () => stocksService.getStockPrice(stockCode),
    enabled: !!stockCode,
    refetchInterval: 5000,
  });

  const { addRecentStock } = useRecentStocksStore();

  useEffect(() => {
    if (stockInfo && stockInfo.stockName) {
      addRecentStock({
        code: stockCode,
        name: stockInfo.stockName,
        market: stockInfo.market || 'KRX' 
      });
    }
  }, [stockInfo, stockCode, addRecentStock]);

  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ['stocks', 'chart', stockCode, period],
    queryFn: () => stocksService.getChartData(stockCode, period),
    enabled: !!stockCode,
  });

  const livePrice = stockPrices[stockCode] || stockInfo;

  const { data: relatedNews, isLoading: isNewsLoading } = useQuery({
    queryKey: ['news', 'stock', stockCode, livePrice?.stockName],
    queryFn: () => newsService.getNewsByStock(stockCode, livePrice?.stockName),
    enabled: !!stockCode && (!!livePrice?.stockName || !isInfoLoading),
    placeholderData: keepPreviousData,
  });
  
  if (isInfoLoading && !livePrice) {
    return (
      <div className="flex h-screen items-center justify-center bg-toss-bg">
        <div className="animate-pulse text-toss-blue font-bold">주식 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-toss-bg">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto max-w-[1200px] px-10 py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Section: Info & Chart */}
            <div className="flex-1 bg-white rounded-toss-large p-12 shadow-toss border border-gray-100">
              <StockDetailHeader 
                name={livePrice?.stockName || stockCode}
                code={stockCode}
                currentPrice={livePrice?.price || 0}
                change={livePrice?.change || 0}
                changePercent={livePrice?.changePercent || 0}
                high={livePrice?.high} // These might not be in the basic price API yet
                low={livePrice?.low}
              />

              <AIReasonBanner stockCode={stockCode} />

              <div className="mt-8">
                <div className="flex gap-2 mb-6">
                  {(['1D', '1W', '1M', '1Y'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[13px] font-bold transition-all",
                        period === p 
                          ? "bg-toss-text-primary text-white" 
                          : "bg-toss-bg text-toss-text-secondary hover:bg-gray-200"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                
                <div className="h-[400px] w-full relative">
                  {isChartLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 rounded-xl">
                      <div className="animate-spin h-6 w-6 border-2 border-toss-blue border-t-transparent rounded-full" />
                    </div>
                  ) : null}
                  {chartData && chartData.length > 0 ? (
                    <StockChart 
                        data={chartData} 
                        color={(livePrice?.change || 0) >= 0 ? '#F04452' : '#3182F6'} 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-toss-text-secondary/50 font-medium">
                        차트 데이터가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Highlights */}
              <div className="mt-8">
                <FinancialHighlightsCard 
                  per={livePrice?.per}
                  pbr={livePrice?.pbr}
                  eps={livePrice?.eps}
                  marketCap={livePrice?.marketCap}
                />
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-[20px] font-bold text-toss-text-primary mb-6">최신 뉴스</h3>
                {isNewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : relatedNews && relatedNews.length > 0 ? (
                  <div className="grid gap-6">
                    {relatedNews.slice(0, 5).map((item) => (
                      <NewsCard key={item.id} news={item} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-toss-text-secondary bg-toss-bg/50 rounded-2xl">
                    관련 뉴스가 없습니다.
                  </div>
                )}
              </div>

              <div className="mt-16">
                 <section>
                    <StockCommunity stockCode={stockCode} />
                 </section>
              </div>
            </div>

            {/* Right Section: AI Insights & Notifications */}
            <div className="w-full lg:w-[400px]">
              <div className="sticky top-12">
                <AIStockAnalysisCard 
                  stockCode={stockCode}
                  stockName={livePrice?.stockName || stockCode}
                  changePercent={livePrice?.changePercent || 0}
                />

                <StockNotificationCard 
                  stockName={livePrice?.stockName || stockCode}
                />
                
                {/* Investor Trading Trend */}
                <InvestorTrendCard stockCode={stockCode} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
