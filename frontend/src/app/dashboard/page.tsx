'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search,
  Bell,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import api from '@/shared/api/api';
import { stocksService } from '@/features/stocks/services/stocksService';
import { WatchlistStar } from '@/features/stocks/components/WatchlistStar';
import { SearchResultList } from '@/features/stocks/components/SearchResultList';
import { ThemeClustering } from '@/features/stocks/components/ThemeClustering';
import { NotificationDropdown } from '@/shared/components/layout/NotificationDropdown';

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type DiscoveryTabType = '실시간 인기' | '급상승' | '급하락' | '거래대금';
type MarketType = '전체' | '코스피' | '코스닥';

const ALL_STOCKS: any[] = [];

/**
 * 메인 대시보드 페이지 컴포넌트
 */
export default function DashboardPage() {
  const { settings } = useTheme();
  const router = useRouter();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const { stockPrices, subscribeStock } = useWebSocket();

  const [activeStock, setActiveStock] = useState('005930');
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<DiscoveryTabType>('실시간 인기');
  const [activeMarket, setActiveMarket] = useState<MarketType>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.push('/login');
    }
  }, [accessToken, _hasHydrated, router]);

  const { data: rankingData, isLoading: isRankingLoading } = useQuery({
    queryKey: ['stocks', 'ranking', activeDiscoveryTab, activeMarket],
    queryFn: () => {
      const typeMap: Record<DiscoveryTabType, 'volume' | 'gainers' | 'losers'> = {
        '실시간 인기': 'volume',
        '급상승': 'gainers',
        '급하락': 'losers',
        '거래대금': 'volume' 
      };
      return stocksService.getRanking(activeMarket, typeMap[activeDiscoveryTab]);
    },
    refetchInterval: 30000, 
  });

  const currentRanking: any[] = (Array.isArray(rankingData) ? rankingData : [])
    .filter((item: any) => {
      const matchesSearch = !searchQuery || 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.code?.includes(searchQuery);
      return matchesSearch;
    })
    .sort((a, b) => {
      if (activeDiscoveryTab === '거래대금') {
        return Number(b.tradingValue || 0) - Number(a.tradingValue || 0);
      }
      return 0;
    });

  const rankingCodes = currentRanking.map(item => item.code).join(',');
  useEffect(() => {
    if (currentRanking.length > 0) {
      currentRanking.forEach((item: any) => subscribeStock(item.code));
    }
  }, [rankingCodes, subscribeStock]);

  if (!_hasHydrated || !accessToken) return null;

  const currentStockData = stockPrices[activeStock];
  const isCurrentUp = (currentStockData?.change || 0) >= 0;

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 flex-1">
             <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="주식 검색 (예: 삼성전자)"
                  className="pl-10 h-10 bg-slate-100/50 dark:bg-slate-900/50 border-none focus-visible:ring-toss-blue/50 rounded-full text-slate-900 dark:text-slate-100 font-bold"
                />

                <AnimatePresence>
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                    >
                      <SearchResultList query={searchQuery} onSelect={(stock: any) => {
                          setSearchQuery('');
                          router.push(`/stocks/${stock.code}`);
                      }} />
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <NotificationDropdown />
             <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-all">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-toss-blue to-blue-400 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-toss-blue/20">
                   {user?.nickname?.[0] || 'U'}
                </div>
                <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{user?.nickname || '사용자'}</p>
                    <p className="text-[10px] text-slate-500 font-medium">실력파 투자자</p>
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col p-6 lg:p-10 max-w-[1240px] mx-auto w-full gap-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-toss-blue/10 text-toss-blue border-none font-bold px-3 py-1">Real-time Market</Badge>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">오늘의 시장 인사이트</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">실시간으로 가장 뜨거운 종목들을 AI가 분석해 드립니다.</p>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-toss-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-toss-blue"></span>
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">실시간 동기화 중</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-toss-blue/10 rounded-xl">
                 <TrendingUp className="h-5 w-5 text-toss-blue" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">실시간 테마 분석</h2>
              <Badge variant="outline" className="ml-2 border-toss-blue/20 text-toss-blue">AI 클러스터링</Badge>
            </div>
            <ThemeClustering />
          </div>

          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden flex flex-col min-h-[700px] rounded-[32px]">
             <CardHeader className="p-10 pb-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                  <Tabs value={activeDiscoveryTab} onValueChange={(v) => setActiveDiscoveryTab(v as DiscoveryTabType)} className="w-auto">
                    <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl h-auto border border-slate-100 dark:border-slate-800">
                      {[
                        { id: '실시간 인기', icon: TrendingUp },
                        { id: '급상승', icon: Zap },
                        { id: '급하락', icon: TrendingDown },
                        { id: '거래대금', icon: BarChart3 }
                      ].map((tab) => (
                        <TabsTrigger 
                          key={tab.id} 
                          value={tab.id}
                          className="px-6 py-2.5 rounded-xl text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-toss-blue data-[state=active]:shadow-md transition-all"
                        >
                          <tab.icon className="h-4 w-4 mr-2" />
                          {tab.id}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>

                  <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {(['전체', '코스피', '코스닥'] as MarketType[]).map((market) => (
                      <button
                        key={market}
                        onClick={() => setActiveMarket(market)}
                        className={cn(
                          "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                          activeMarket === market 
                            ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-md" 
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                        )}
                      >
                         {market === '전체' ? <Globe className="h-4 w-4 inline mr-2" /> : null}
                         {market}
                      </button>
                    ))}
                  </div>
                </div>
             </CardHeader>
             
             <CardContent className="p-0 flex-1 overflow-hidden flex flex-col px-10">
                <div className="overflow-y-auto custom-scrollbar flex-1 pb-10">
                  {isRankingLoading ? (
                      <div className="flex flex-col items-center justify-center h-96">
                           <div className="animate-spin h-10 w-10 border-4 border-toss-blue border-t-transparent rounded-full mb-6" />
                           <p className="text-slate-500 font-bold text-lg animate-pulse">실시간 시장 데이터 분석 중...</p>
                      </div>
                  ) : currentRanking.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-transparent border-b-2 border-slate-50 dark:border-slate-800">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-20 text-center text-xs font-bold uppercase tracking-widest text-slate-400">순위</TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400">종목</TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-slate-400">현재가</TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-slate-400">전일대비</TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-slate-400">등락률</TableHead>
                          <TableHead className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">관심</TableHead>
                          <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">거래대금</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRanking.map((item, index) => {
                          const wsPrice = stockPrices[item.code];
                          const currentPrice = Number(wsPrice?.price ?? item.price ?? 0);
                          const changeAmount = Number(wsPrice?.change ?? item.change ?? 0);
                          const changePercent = wsPrice?.changePercent ?? item.changePercent ?? 0;
                          
                          const isUp = changeAmount > 0;
                          const isDown = changeAmount < 0;
                          
                          const formatValue = (val: number) => {
                            if (!val) return '---';
                            if (val >= 1000000000000) return `${(val / 1000000000000).toFixed(1)}조`;
                            if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
                            return `${(val / 10000).toFixed(0)}만`;
                          };

                          const chartColorStyle = settings?.chartColorStyle || 'kr';
                          const textColor = isUp 
                            ? (chartColorStyle === 'kr' ? 'text-rose-500' : 'text-emerald-500')
                            : isDown 
                              ? (chartColorStyle === 'kr' ? 'text-blue-500' : 'text-rose-500')
                              : 'text-slate-400';

                          return (
                            <TableRow 
                              key={item.code} 
                              onClick={() => router.push(`/stocks/${item.code}`)}
                              className="group cursor-pointer border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-300 h-24"
                            >
                              <TableCell className="text-center">
                                <span className={cn(
                                  "inline-flex items-center justify-center h-8 w-8 rounded-full font-black text-sm",
                                  index < 3 ? "bg-toss-blue text-white shadow-lg shadow-toss-blue/20" : "text-slate-400"
                                )}>
                                  {index + 1}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold group-hover:bg-toss-blue/10 group-hover:text-toss-blue transition-all duration-300">
                                    {item.name?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none group-hover:text-toss-blue transition-colors">{item.name}</p>
                                    <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{item.code} · {item.market}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                  {currentPrice.toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className={cn("text-right font-bold", textColor)}>
                                <div className="flex items-center justify-end gap-1">
                                  {isUp ? '▲' : isDown ? '▼' : ''} 
                                  <span>{Math.abs(changeAmount).toLocaleString()}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary" className={cn(
                                  "font-black py-1.5 px-3 rounded-xl border-none shadow-sm",
                                  isUp 
                                    ? (chartColorStyle === 'kr' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400')
                                    : isDown 
                                      ? (chartColorStyle === 'kr' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400')
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                )}>
                                  {isUp ? '+' : ''}{changePercent}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div onClick={(e) => e.stopPropagation()} className="hover:scale-125 transition-transform duration-200">
                                  <WatchlistStar stockCode={item.code} />
                                </div>
                              </TableCell>
                              <TableCell className="text-right hidden lg:table-cell">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                  {formatValue(Number(item.tradingValue || 0))}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96">
                         <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6">
                            <Search className="h-10 w-10 text-slate-200" />
                         </div>
                         <p className="text-slate-500 font-bold text-lg">조회된 데이터가 없습니다.</p>
                         <p className="text-slate-400 text-sm mt-2 font-medium">검색어나 필터를 조정해 보세요.</p>
                    </div>
                  )}
                </div>
             </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
