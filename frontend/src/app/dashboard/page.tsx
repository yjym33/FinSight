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
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import api from '@/shared/api/api';
import { stocksService } from '@/features/stocks/services/stocksService';
import { WatchlistStar } from '@/features/stocks/components/WatchlistStar';
import { SearchResultList } from '@/features/stocks/components/SearchResultList';
import { NotificationDropdown } from '@/shared/components/layout/NotificationDropdown';

type DiscoveryTabType = '실시간 인기' | '급상승' | '급하락' | '거래대금';
type MarketType = '전체' | '코스피' | '코스닥';

const ALL_STOCKS: any[] = [];

/**
 * 메인 대시보드 페이지 컴포넌트
 * 역할: 로그인 완료 후 가장 먼저 보이는 화면.
 * 실시간 주식 랭킹, 검색 기능을 제공하며 전반적인 시장 정보(인기, 상승/하락 등)를 보여줍니다.
 */
export default function DashboardPage() {
  const { settings } = useTheme();
  const router = useRouter();
  // Zustand 전역 상태: 사용자 인증 정보
  const { user, accessToken, _hasHydrated } = useAuthStore();
  // 커스텀 훅: 웹소켓을 통한 실시간 주식 가격(stockPrices) 상태 및 구독(subscribe)
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

  const { data: rankingData, isLoading: isRankingLoading, error: rankingError } = useQuery({
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
    <div className="flex min-h-screen bg-toss-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-white px-10 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-gray-100">
          <div className="flex items-center gap-8 flex-1">
             <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-toss-text-placeholder" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="관심 있는 주식을 검색해 보세요 (예: 삼성전자)"
                  className="w-full rounded-[14px] bg-toss-bg py-3 pl-12 pr-4 text-[15px] outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all font-medium text-toss-text-primary"
                />

                <AnimatePresence>
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-toss-large border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
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
          <div className="flex items-center gap-4">
             <NotificationDropdown />
             <div className="h-8 w-px bg-gray-200" />
             <div className="flex items-center gap-3 pl-2 cursor-default">
                <div className="h-9 w-9 rounded-full bg-toss-blue text-white flex items-center justify-center font-bold">
                   {user?.nickname?.[0] || 'U'}
                </div>
                <div className="hidden md:block text-right">
                    <p className="text-[13px] font-bold text-toss-text-primary text-left">{user?.nickname || '사용자'}님</p>
                    <p className="text-[11px] text-toss-text-secondary">반가워요!</p>
                </div>
             </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1000px] flex p-8 h-[calc(100vh-80px)] overflow-hidden">
          
          {/* Main Dashboard: Ranking List */}
          <div className="flex-1 flex flex-col bg-white rounded-toss-large shadow-sm overflow-hidden h-full">
             <div className="px-8 pt-8 pb-4">
                  <h2 className="text-[24px] font-bold text-toss-text-primary mb-6">지금 주목받는 주식 (실시간 차트)</h2>
                  
                  {/* Discovery Primary Tabs - Restored to Simple Single Tab as requested */}
                  <div className="flex gap-8 border-b border-gray-100">
                      {[
                        { id: '실시간 인기', label: '실시간 인기' }
                      ].map((tab) => (
                        <button 
                          key={tab.id}
                          onClick={() => setActiveDiscoveryTab(tab.id as DiscoveryTabType)}
                          className={cn(
                            "pb-4 text-[17px] font-bold border-b-[3px] transition-all flex items-center gap-2",
                            activeDiscoveryTab === tab.id 
                                ? "border-toss-text-primary text-toss-text-primary" 
                                : "border-transparent text-toss-text-secondary hover:text-toss-text-primary"
                          )}
                        >
                           {tab.label}
                        </button>
                      ))}
                  </div>
                  
                  {/* Market Chips */}
                  <div className="flex gap-2 py-5">
                      {(['전체', '코스피', '코스닥'] as MarketType[]).map((market) => (
                          <button 
                            key={market} 
                            onClick={() => setActiveMarket(market)}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-[13px] font-bold transition-all border",
                              activeMarket === market 
                                ? "bg-toss-text-primary text-white border-toss-text-primary shadow-sm" 
                                : "bg-white text-toss-text-secondary border-gray-200 hover:border-gray-300"
                          )}>
                              {market}
                          </button>
                      ))}
                  </div>
             </div>

             {/* Ranking List Table */}
             <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                {isRankingLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                         <div className="animate-spin h-10 w-10 border-4 border-toss-blue border-t-transparent rounded-full mb-4" />
                         <p className="text-toss-text-secondary font-medium">실시간 순위를 불러오는 중...</p>
                    </div>
                ) : currentRanking.length > 0 ? (
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                        <tr>
                            <th className="py-3 font-medium text-[13px] text-toss-text-placeholder w-12 text-center">순위</th>
                            <th className="py-3 font-medium text-[13px] text-toss-text-placeholder">종목명</th>
                            <th className="py-3 font-medium text-[13px] text-toss-text-placeholder text-right">현재가</th>
                            <th className="py-3 font-medium text-[13px] text-toss-text-placeholder text-right w-24">전일종가</th>
                            <th className="py-3 font-medium text-[13px] text-toss-text-placeholder text-right w-20">등락률</th>
                            <th className="py-3 font-medium text-[13px] text-toss-text-placeholder text-center w-14">관심</th>
                            <th className="py-3 font-medium text-[13px] text-toss-text-placeholder text-right w-32 hidden lg:table-cell">거래대금</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRanking.map((item, index) => {
                            const wsPrice = stockPrices[item.code];
                            const currentPrice = Number(wsPrice?.price ?? item.price ?? 0);
                            const changeAmount = Number(wsPrice?.change ?? item.change ?? 0);
                            const changePercent = wsPrice?.changePercent ?? item.changePercent ?? 0;
                            const tradingValue = Number(item.tradingValue ?? 0);
                            
                            const isUp = changeAmount >= 0;
                            const active = activeStock === item.code;
                            
                            const formatValue = (val: number) => {
                                if (!val) return '---';
                                if (val >= 1000000000000) return `${(val / 1000000000000).toFixed(1)}조`;
                                if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
                                if (val >= 10000) return `${(val / 10000).toFixed(0)}만`;
                                return val.toLocaleString();
                            };

                            const prevClose = currentPrice - changeAmount;

                            const chartColorStyle = settings?.chartColorStyle || 'kr';
                            const colorClass = isUp 
                              ? (chartColorStyle === 'kr' ? 'text-toss-red' : 'text-toss-green')
                              : (chartColorStyle === 'kr' ? 'text-toss-blue' : 'text-toss-red');

                            return (
                                <motion.tr 
                                    whileHover={{ backgroundColor: 'var(--toss-bg)' }}
                                    key={item.code} 
                                    onClick={() => {
                                        setActiveStock(item.code);
                                        router.push(`/stocks/${item.code}`);
                                    }}
                                    className={cn(
                                        "border-b border-gray-50 transition-colors cursor-pointer group",
                                        active ? "bg-toss-bg/50" : ""
                                    )}
                                >
                                    <td className="py-5 text-center">
                                        <span className={cn(
                                            "text-[15px] font-bold",
                                            index < 3 ? "text-toss-text-primary" : "text-toss-text-secondary"
                                        )}>{index + 1}</span>
                                    </td>
                                    <td className="py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-toss-bg flex items-center justify-center text-[13px] font-bold text-toss-text-secondary">
                                                {item.name?.[0] || 'S'}
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-bold text-toss-text-primary group-hover:underline underline-offset-4">{item.name}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-[11px] text-toss-text-placeholder">{item.market}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 text-right">
                                        <p className="text-[15px] font-bold text-toss-text-primary">
                                            {currentPrice > 0 ? currentPrice.toLocaleString() : '---'}
                                        </p>
                                    </td>
                                    <td className="py-5 text-right">
                                        <p className="text-[14px] text-toss-text-placeholder">
                                            {prevClose > 0 ? prevClose.toLocaleString() : '---'}
                                        </p>
                                    </td>
                                    <td className="py-5 text-right border-0">
                                        <p className={cn(
                                            "text-[14px] font-bold",
                                            (wsPrice || item.changePercent) ? colorClass : 'text-toss-text-placeholder'
                                        )}>
                                            {Number(changePercent) !== 0 ? `${Number(changePercent) > 0 ? '+' : ''}${changePercent}%` : '--'}
                                        </p>
                                    </td>
                                    <td className="py-5 text-center">
                                        <WatchlistStar stockCode={item.code} />
                                    </td>
                                    <td className="py-5 text-right hidden lg:table-cell">
                                        <p className="text-[14px] font-medium text-toss-text-secondary">
                                            {formatValue(tradingValue)}
                                        </p>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                         <p className="text-toss-text-secondary font-medium">데이터가 없습니다.</p>
                    </div>
                )}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
