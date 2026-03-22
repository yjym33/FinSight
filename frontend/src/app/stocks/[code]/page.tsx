'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, Suspense } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ChevronLeft, 
  Share2, 
  MoreHorizontal,
  Info,
  Newspaper,
  MessageSquare,
  BarChart4,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import api from '@/shared/api/api';
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
import { CompanyIntroCard } from '@/features/stocks/components/CompanyIntroCard';
import { ErrorBoundary } from '@/shared/components/common/ErrorBoundary';

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
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
      <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 p-10 space-y-8 animate-pulse">
           <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-48" />
              <div className="flex gap-2">
                 <Skeleton className="h-10 w-10 rounded-full" />
                 <Skeleton className="h-10 w-10 rounded-full" />
              </div>
           </div>
           <Card className="rounded-[32px] border-none shadow-xl h-[500px]" />
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="h-64 rounded-[32px]" />
              <Skeleton className="h-64 rounded-[32px]" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 border-b border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-slate-500">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{livePrice?.stockName || stockCode}</p>
              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border-none">{stockCode}</Badge>
           </div>
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full"><Share2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
           </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-[1400px] mx-auto w-full gap-8 grid grid-cols-1 xl:grid-cols-12 overflow-y-auto">
          {/* Left Column: Chart & Info */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            <Card className="rounded-[40px] border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden p-10 pt-12">
              <StockDetailHeader 
                name={livePrice?.stockName || stockCode}
                code={stockCode}
                currentPrice={livePrice?.price || 0}
                change={livePrice?.change || 0}
                changePercent={livePrice?.changePercent || 0}
                high={livePrice?.high}
                low={livePrice?.low}
              />

              <div className="mt-6 mb-10">
                <AIReasonBanner stockCode={stockCode} />
              </div>

              <div className="space-y-6">
                <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
                  <div className="flex items-center justify-between">
                    <TabsList className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
                      {['1D', '1W', '1M', '1Y'].map((p) => (
                        <TabsTrigger 
                          key={p} 
                          value={p}
                          className="px-6 py-2 rounded-xl text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-toss-blue transition-all"
                        >
                          {p}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <Clock className="h-3 w-3" />
                       REAL-TIME UPDATE
                    </div>
                  </div>
                </Tabs>
                
                <div className="h-[450px] w-full relative bg-slate-50/30 dark:bg-slate-950/30 rounded-3xl p-4">
                  {isChartLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 rounded-3xl">
                       <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin h-8 w-8 border-4 border-toss-blue border-t-transparent rounded-full" />
                          <p className="text-xs font-bold text-slate-500">차트 로딩 중...</p>
                       </div>
                    </div>
                  )}
                  {chartData && chartData.length > 0 ? (
                    <StockChart 
                        data={chartData} 
                        color={(livePrice?.change || 0) >= 0 ? '#F04452' : '#3182F6'} 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-300">
                        <BarChart4 className="h-12 w-12" />
                        <p className="font-bold">차트 데이터가 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="rounded-[40px] border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 backdrop-blur-sm p-10">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <Info className="h-5 w-5 text-toss-blue" />
                    핵심 지표 컨디션
                  </h3>
               </div>
               <FinancialHighlightsCard 
                  per={livePrice?.per}
                  pbr={livePrice?.pbr}
                  eps={livePrice?.eps}
                  marketCap={livePrice?.marketCap}
                />
            </Card>

            <div className="space-y-6">
               <div className="flex items-center justify-between px-4">
                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <Newspaper className="h-5 w-5 text-toss-blue" />
                    관련 핫 클립
                  </h3>
                  <Button variant="ghost" size="sm" className="text-toss-blue font-bold">전체보기</Button>
               </div>
               {isNewsLoading ? (
                  <div className="grid gap-6">
                    {[1, 2, 3].map((i) => (
                       <Skeleton key={i} className="h-32 rounded-3xl" />
                    ))}
                  </div>
                ) : relatedNews && relatedNews.length > 0 ? (
                  <div className="grid gap-6">
                    {relatedNews.slice(0, 5).map((item) => (
                      <NewsCard key={item.id} news={item} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-16 border-none text-center bg-white dark:bg-slate-900 rounded-[32px]">
                     <p className="text-slate-400 font-bold">분석에 활용할 최신 소식이 아직 없습니다.</p>
                  </Card>
                )}
            </div>

            <div className="mt-4 pb-12">
               <div className="flex items-center gap-3 px-4 mb-6">
                  <MessageSquare className="h-5 w-5 text-toss-blue" />
                  <h3 className="text-xl font-black tracking-tight">수다방</h3>
               </div>
               <StockCommunity stockCode={stockCode} />
            </div>
          </div>

          {/* Right Column: AI & Strategy */}
          <div className="xl:col-span-4 flex flex-col gap-8">
              <div className="sticky top-[84px] space-y-8">
                 <ErrorBoundary>
                    <Suspense fallback={
                       <Card className="bg-white dark:bg-slate-900 rounded-toss-large p-8 shadow-toss border border-gray-100 dark:border-slate-800 mb-6">
                         <div className="flex items-center gap-2 mb-4">
                           <Skeleton className="h-5 w-32" />
                         </div>
                         <Skeleton className="h-4 w-full mb-2" />
                         <Skeleton className="h-4 w-2/3" />
                       </Card>
                    }>
                       <CompanyIntroCard 
                         stockCode={stockCode}
                         stockName={livePrice?.stockName || stockCode}
                       />
                    </Suspense>
                 </ErrorBoundary>

                 <ErrorBoundary>
                    <Suspense fallback={
                       <div className="bg-white dark:bg-slate-900 rounded-toss-large p-8 shadow-toss border border-gray-100 dark:border-slate-800 mb-6 flex flex-col items-center justify-center min-h-[300px]">
                         <Loader2 className="h-8 w-8 text-toss-blue animate-spin mb-4" />
                         <p className="text-toss-text-secondary dark:text-slate-400 font-medium text-[14px]">AI가 종목뉴스와 시세를 분석 중입니다...</p>
                       </div>
                    }>
                       <AIStockAnalysisCard 
                         stockCode={stockCode}
                         stockName={livePrice?.stockName || stockCode}
                         changePercent={livePrice?.changePercent || 0}
                       />
                    </Suspense>
                 </ErrorBoundary>

                 <InvestorTrendCard stockCode={stockCode} />

                 <StockNotificationCard 
                   stockName={livePrice?.stockName || stockCode}
                 />
              </div>
          </div>
        </main>
      </div>
    </div>
  );
}
