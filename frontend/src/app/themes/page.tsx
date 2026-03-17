'use client';

import { useQuery } from '@tanstack/react-query';
import { stocksService } from '@/features/stocks/services/stocksService';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { motion } from 'framer-motion';
import { ChevronLeft, Zap, Info, TrendingUp, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { useEffect, useState } from 'react';

export default function ThemeMarketPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { data: themes, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['market-themes-detailed'],
    queryFn: stocksService.getThemes,
    staleTime: 1000, // Reduced for immediate feedback during fixes
  });

  const getThemeColor = (strength: number, idx: number) => {
    if (idx === 0) return 'bg-[#F04452]'; // Leading theme is usually hot
    if (strength >= 70) return 'bg-[#F04452]'; // Strong hot
    if (strength >= 40) return 'bg-[#4E5968]'; // Neutral/Middle
    return 'bg-[#3182F6]'; // Cool/Blue
  };

  const { data: indices } = useQuery({
    queryKey: ['market-indices-mini'],
    queryFn: stocksService.getMarketIndices,
    refetchInterval: 10000,
  });

  return (
    <div className="flex min-h-screen bg-[#F2F4F6] dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white dark:bg-slate-900 px-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-slate-500">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">실시간 마켓 테마</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              기준: {mounted ? new Date().toLocaleTimeString() : '--:--:--'}
            </span>
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn("rounded-full", isFetching && "animate-spin")}
                onClick={() => refetch()}
            >
                <RefreshCw className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1400px] mx-auto w-full overflow-y-auto">
          {/* Market Status Tickers */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {['-3% ↓', '-2%', '-1%', '0%', '1%', '2%', '3% ↑'].map((val, i) => (
              <div 
                key={i} 
                className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-black tracking-tighter min-w-[70px] text-center",
                    i < 3 ? "bg-blue-100 text-blue-600" : i > 3 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                )}
              >
                {val}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-4 grid-rows-3 gap-3 h-[700px]">
               <div className="col-span-2 row-span-3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
               <div className="col-span-1 row-span-1 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-2xl" />
               <div className="col-span-1 row-span-1 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-2xl" />
               <div className="col-span-2 row-span-2 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-2xl" />
            </div>
          ) : themes && themes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:h-[750px] auto-rows-fr">
              {/* Rank 1: Largest Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "col-span-2 row-span-2 md:row-span-3 rounded-[32px] p-8 text-white relative flex flex-col justify-end group cursor-pointer shadow-lg",
                    getThemeColor(themes[0].strength, 0)
                )}
              >
                <div className="absolute top-8 left-8">
                  <Badge className="bg-white/20 text-white border-none font-black text-[10px] px-2 py-0.5 mb-2">1위</Badge>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-4">{themes[0].theme}</h2>
                </div>
                <div className="absolute top-8 right-8 opacity-20 group-hover:scale-110 transition-transform">
                   <Zap className="h-16 w-16" />
                </div>
                <div className="space-y-4">
                   <p className="text-white/80 font-medium leading-relaxed max-w-sm text-sm md:text-base">
                     {themes[0].reason}
                   </p>
                   <div className="flex flex-wrap gap-2 text-white/90">
                     {themes[0].stocks.map(stock => (
                        <span key={stock} className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold ring-1 ring-white/20">
                           {stock}
                        </span>
                     ))}
                   </div>
                   <div className="text-4xl font-black mt-2">+{themes[0].strength}%</div>
                </div>
              </motion.div>

              {/* Other Themes in Grid */}
              {themes.slice(1).map((item, idx) => (
                <motion.div
                  key={item.theme}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (idx + 1) * 0.05 }}
                  className={cn(
                    "rounded-[24px] p-6 text-white relative flex flex-col justify-between group cursor-pointer hover:brightness-110 transition-all",
                    getThemeColor(item.strength, idx + 1),
                  )}
                >
                  <div className="flex justify-between items-start">
                    <Badge className="bg-white/20 text-white border-none font-black text-[10px] px-2 py-0.5">{idx + 2}위</Badge>
                    <Info className="h-4 w-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-bold tracking-tight leading-tight line-clamp-2 mb-1">{item.theme}</h3>
                    <div className="text-xl font-black">+{item.strength}%</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5 overflow-hidden h-12">
                    {item.stocks.slice(0, 3).map(stock => (
                      <span key={stock} className="text-[10px] bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-md font-bold text-white/90">
                        {stock}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center flex-col text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
               <p className="font-bold text-lg text-slate-600 dark:text-slate-300">현재 활성화된 테마 분석 데이터가 없습니다.</p>
               <p className="text-sm mt-2 mb-6">AI가 시장 데이터를 분석하는 중이거나 일시적인 지연이 발생할 수 있습니다.</p>
               <Button 
                onClick={() => refetch()} 
                variant="outline"
                className="rounded-full px-8 border-slate-300 text-slate-600 hover:bg-slate-100"
               >
                 <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
                 다시 시도하기
               </Button>
               {error && (
                 <p className="mt-4 text-xs text-red-500 font-mono">
                   Error: {(error as any)?.message || 'Unknown error'}
                 </p>
               )}
            </div>
          )}
        </main>

        <footer className="h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              {indices?.kospi && (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[11px] font-black text-slate-400">KOSPI</span>
                    <span className={cn("text-xs font-black", indices.kospi.change >= 0 ? "text-[#F04452]" : "text-[#3182F6]")}>
                        {indices.kospi.price.toLocaleString()}
                    </span>
                    <span className={cn("text-[10px] font-bold", indices.kospi.change >= 0 ? "text-[#F04452]" : "text-[#3182F6]")}>
                        {indices.kospi.change >= 0 ? '▲' : '▼'} {Math.abs(indices.kospi.change).toFixed(2)} ({indices.kospi.changePercent.toFixed(2)}%)
                    </span>
                  </div>
              )}
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
              {indices?.kosdaq && (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[11px] font-black text-slate-400">KOSDAQ</span>
                    <span className={cn("text-xs font-black", indices.kosdaq.change >= 0 ? "text-[#F04452]" : "text-[#3182F6]")}>
                        {indices.kosdaq.price.toLocaleString()}
                    </span>
                    <span className={cn("text-[10px] font-bold", indices.kosdaq.change >= 0 ? "text-[#F04452]" : "text-[#3182F6]")}>
                        {indices.kosdaq.change >= 0 ? '▲' : '▼'} {Math.abs(indices.kosdaq.change).toFixed(2)} ({indices.kosdaq.changePercent.toFixed(2)}%)
                    </span>
                  </div>
              )}
           </div>
           <div className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              FinSight Market Radar
           </div>
        </footer>
      </div>
    </div>
  );
}
