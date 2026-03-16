'use client';

import { useGlobalSidebarStore } from '@/shared/store/sidebarStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Clock, TrendingUp, Wallet, Search, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/api/api';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { stocksService } from '@/features/stocks/services/stocksService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useRecentStocksStore } from '@/features/stocks/store/recentStocksStore';
import { SidebarSearchResultList } from '@/shared/components/layout/sidebar/SidebarSearchResultList';
import { useTheme } from '@/shared/providers/ThemeProvider';

export function ExpandableSidebar() {
  const { settings } = useTheme();
  const { isOpen, activeTab, close } = useGlobalSidebarStore();
  const { stockPrices, subscribeStock } = useWebSocket();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { accessToken, _hasHydrated } = useAuthStore();
  const { data: watchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const response = await api.get('/watchlist');
      return response.data;
    },
    enabled: activeTab === 'watchlist' && _hasHydrated && !!accessToken,
  });

  const { data: rankingData, isLoading: isRankingLoading } = useQuery({
    queryKey: ['stocks', 'ranking', 'sidebar'],
    queryFn: () => stocksService.getRanking('전체'),
    enabled: activeTab === 'realtime',
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (watchlist?.length > 0) {
      watchlist.forEach((item: { stockCode: string }) => {
        subscribeStock(item.stockCode);
      });
    }
  }, [watchlist, subscribeStock]);

  const { recentStocks } = useRecentStocksStore();

  useEffect(() => {
    if (recentStocks?.length > 0) {
      recentStocks.forEach((item) => {
        subscribeStock(item.code);
      });
    }
  }, [recentStocks, subscribeStock]);

  const titles = {
    watchlist: { label: '관심주식', icon: Heart },
    recent: { label: '최근 본 주식', icon: Clock },
    realtime: { label: '실시간 순위', icon: TrendingUp },
  };

  const ActiveIcon = activeTab && titles[activeTab as keyof typeof titles] 
    ? titles[activeTab as keyof typeof titles].icon 
    : X;

  const currentTitle = activeTab && titles[activeTab as keyof typeof titles] 
    ? titles[activeTab as keyof typeof titles].label 
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-[60px] top-0 z-40 h-full w-[320px] border-l border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[-8px_0_24px_rgba(0,0,0,0.03)] dark:shadow-none"
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex h-20 items-center justify-between px-8 border-b border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-toss-bg dark:bg-slate-800">
                  <ActiveIcon className="h-5 w-5 text-toss-text-primary dark:text-slate-100" />
                </div>
                <h2 className="text-[17px] font-bold text-toss-text-primary dark:text-slate-100">
                  {currentTitle}
                </h2>
              </div>
              <button 
                onClick={close}
                className="p-2 rounded-full hover:bg-toss-bg dark:hover:bg-slate-800 transition-colors"
                title="닫기"
              >
                <X className="h-5 w-5 text-toss-text-placeholder dark:text-slate-500 hover:text-toss-text-primary dark:hover:text-slate-300 transition-colors" />
              </button>
            </div>

            {/* Sidebar Search Bar */}
            <div className="p-6 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-toss-text-placeholder dark:text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="종목 검색" 
                  className="w-full rounded-xl bg-toss-bg dark:bg-slate-800 py-2.5 pl-10 pr-4 text-[14px] text-toss-text-primary dark:text-slate-100 outline-none hover:bg-gray-200 dark:hover:bg-slate-700 focus:ring-2 focus:ring-toss-blue/20 transition-all font-medium placeholder:text-toss-text-placeholder dark:placeholder:text-slate-500"
                />

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-toss-large dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden z-50 max-h-[300px] overflow-y-auto"
                    >
                      <SidebarSearchResultList 
                        query={searchQuery} 
                        onSelect={(code: string) => {
                          setSearchQuery('');
                          close();
                          router.push(`/stocks/${code}`);
                        }} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
              {activeTab === 'watchlist' && (
                <div className="space-y-4">
                  {watchlist?.length > 0 ? watchlist.map((item: any) => {
                    const wsPrice = stockPrices[item.stockCode];
                    const currentPrice = Number(wsPrice?.price || 0);
                    const changePercent = wsPrice?.changePercent || 0;
                    const isUp = Number(wsPrice?.change || 0) >= 0;
                    
                    const chartColorStyle = settings?.chartColorStyle || 'kr';
                    const colorClass = isUp 
                      ? (chartColorStyle === 'kr' ? 'text-toss-red' : 'text-toss-green')
                      : (chartColorStyle === 'kr' ? 'text-toss-blue' : 'text-toss-red');
                    
                    return (
                      <button
                        key={item.stockCode}
                        onClick={() => router.push(`/stocks/${item.stockCode}`)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-toss-bg dark:hover:bg-slate-800 group transition-all"
                      >
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-full bg-toss-bg dark:bg-slate-800 flex items-center justify-center text-[12px] font-bold text-toss-text-secondary dark:text-slate-500">
                              {item.stockName?.[0] || 'S'}
                           </div>
                           <div className="text-left">
                              <p className="text-[14px] font-bold text-toss-text-primary dark:text-slate-200">{item.stockName}</p>
                              <p className="text-[11px] text-toss-text-secondary dark:text-slate-500 font-medium">{item.stockCode}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           {currentPrice > 0 ? (
                             <>
                               <p className="text-[14px] font-bold text-toss-text-primary">
                                 {currentPrice.toLocaleString()}
                               </p>
                               <p className={cn(
                                 "text-[12px] font-bold",
                                 colorClass
                               )}>
                                 {Number(changePercent) > 0 ? '+' : ''}{changePercent}%
                               </p>
                             </>
                           ) : (
                             <p className="text-[13px] text-toss-text-placeholder dark:text-slate-500 font-medium">시세 대기 중</p>
                           )}
                        </div>
                      </button>
                    )
                  }) : (
                    <div className="flex flex-col items-center justify-center pt-20 text-center">
                       <span className="text-3xl mb-4 grayscale opacity-40">🔔</span>
                       <p className="text-[13px] text-toss-text-secondary dark:text-slate-400 leading-relaxed">
                         관심 주식을 추가해보세요.<br/>실시간 정보를 모아볼 수 있어요.
                       </p>
                       <button className="mt-4 flex items-center gap-1 text-[14px] font-bold text-toss-blue hover:underline">
                         <Plus className="h-4 w-4" />
                         종목 검색하러 가기
                       </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'realtime' && (
                <div className="space-y-4">
                  {isRankingLoading ? (
                    <div className="flex justify-center py-20">
                      <div className="animate-spin h-6 w-6 border-2 border-toss-blue border-t-transparent rounded-full" />
                    </div>
                  ) : rankingData?.length > 0 ? (
                    rankingData.slice(0, 10).map((item: any, index: number) => {
                      const wsPrice = stockPrices[item.code];
                      const currentPrice = Number(wsPrice?.price || item.price || 0);
                      const changePercent = wsPrice?.changePercent || item.changePercent || 0;
                      const isUp = Number(wsPrice?.change || item.change || 0) >= 0;
                      
                      const chartColorStyle = settings?.chartColorStyle || 'kr';
                      const colorClass = isUp 
                        ? (chartColorStyle === 'kr' ? 'text-toss-red' : 'text-toss-green')
                        : (chartColorStyle === 'kr' ? 'text-toss-blue' : 'text-toss-red');
                      
                      return (
                        <button
                          key={item.code}
                          onClick={() => {
                            router.push(`/stocks/${item.code}`);
                            close();
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-toss-bg dark:hover:bg-slate-800 group transition-all"
                        >
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-full bg-toss-bg dark:bg-slate-800 flex items-center justify-center text-[12px] font-bold text-toss-text-secondary dark:text-slate-500">
                                {index + 1}
                             </div>
                             <div className="text-left">
                                <p className="text-[14px] font-bold text-toss-text-primary dark:text-slate-200">{item.name}</p>
                                <p className="text-[11px] text-toss-text-secondary dark:text-slate-500 font-medium">{item.code}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[14px] font-bold text-toss-text-primary dark:text-slate-200">
                               {currentPrice > 0 ? currentPrice.toLocaleString() : '---'}
                             </p>
                             <p className={cn(
                               "text-[12px] font-bold",
                               (wsPrice || item.changePercent) ? colorClass : 'text-toss-text-placeholder dark:text-slate-500'
                             )}>
                               {Number(changePercent) !== 0 ? `${Number(changePercent) > 0 ? '+' : ''}${changePercent}%` : '--'}
                             </p>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="text-center py-20 text-toss-text-secondary dark:text-slate-500">
                      순위 정보를 불러올 수 없습니다.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recent' && (
                <div className="space-y-4">
                  {recentStocks?.length > 0 ? (
                    recentStocks.map((item) => {
                      const wsPrice = stockPrices[item.code];
                      const currentPrice = Number(wsPrice?.price || 0);
                      const changePercent = wsPrice?.changePercent || 0;
                      const isUp = Number(wsPrice?.change || 0) >= 0;
                      const displayName = wsPrice?.stockName || item.name;
                      
                      const chartColorStyle = settings?.chartColorStyle || 'kr';
                      const colorClass = isUp 
                        ? (chartColorStyle === 'kr' ? 'text-toss-red' : 'text-toss-green')
                        : (chartColorStyle === 'kr' ? 'text-toss-blue' : 'text-toss-red');
                      
                      return (
                        <button
                          key={item.code}
                          onClick={() => {
                            router.push(`/stocks/${item.code}`);
                            close();
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-toss-bg dark:hover:bg-slate-800 group transition-all"
                        >
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-full bg-toss-bg dark:bg-slate-800 flex items-center justify-center text-[12px] font-bold text-toss-text-secondary dark:text-slate-500">
                                {displayName?.[0] || 'S'}
                             </div>
                             <div className="text-left">
                                <p className="text-[14px] font-bold text-toss-text-primary dark:text-slate-200">{displayName}</p>
                                <p className="text-[11px] text-toss-text-secondary dark:text-slate-500 font-medium">{item.code}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {currentPrice > 0 ? (
                               <>
                                 <p className="text-[14px] font-bold text-toss-text-primary dark:text-slate-200">
                                   {currentPrice.toLocaleString()}
                                 </p>
                                 <p className={cn(
                                   "text-[12px] font-bold",
                                   colorClass
                                 )}>
                                   {Number(changePercent) > 0 ? '+' : ''}{changePercent}%
                                 </p>
                               </>
                             ) : (
                               <p className="text-[13px] text-toss-text-placeholder dark:text-slate-500 font-medium">데이터 대기</p>
                             )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-20 text-center">
                       <Clock className="h-10 w-10 text-toss-text-placeholder dark:text-slate-600 mb-4 opacity-20" />
                       <p className="text-[13px] text-toss-text-secondary dark:text-slate-400 opacity-50">
                         최근 본 항목이 없습니다.
                       </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Utility */}
            <div className="p-6 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <button className="text-[13px] font-bold text-toss-text-secondary dark:text-slate-500 hover:text-toss-text-primary dark:hover:text-slate-300 transition-colors">편집</button>
                <button className="text-[13px] font-bold text-toss-blue hover:underline">새 그룹 만들기</button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
