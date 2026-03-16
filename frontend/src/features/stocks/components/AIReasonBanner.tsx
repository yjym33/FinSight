'use client';

import { Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { stocksService } from '@/features/stocks/services/stocksService';

interface AIReasonBannerProps {
  stockCode: string;
}

export function AIReasonBanner({ stockCode }: AIReasonBannerProps) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['stocks', 'analysis', stockCode],
    queryFn: () => stocksService.getStockAnalysis(stockCode),
    enabled: !!stockCode,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  return (
    <div
      className="mt-6 flex items-start gap-3 rounded-2xl bg-toss-bg dark:bg-slate-800 p-5 border border-purple-100/50 dark:border-purple-900/30 relative overflow-hidden group cursor-default min-h-[80px]"
    >
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="mt-0.5 shrink-0 rounded-full bg-purple-100 dark:bg-purple-900/50 p-1.5 text-purple-600 dark:text-purple-400">
        <Sparkles className="h-4 w-4" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-bold text-purple-600 uppercase tracking-wider">AI Reason Finder</span>
        </div>
        
        {isLoading ? (
          <div className="space-y-2 py-1">
            <div className="h-3.5 w-full bg-gray-200 dark:bg-slate-700 animate-pulse rounded" />
            <div className="h-3.5 w-2/3 bg-gray-200 dark:bg-slate-700 animate-pulse rounded" />
          </div>
        ) : analysis?.reason ? (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[15px] font-medium text-toss-text-primary leading-relaxed"
          >
            {analysis.reason}
          </motion.p>
        ) : (
          <p className="text-[15px] font-medium text-toss-text-secondary/60 italic leading-relaxed">
            현재 시장 상황과 뉴스를 바탕으로 변동 원인을 분석하고 있습니다...
          </p>
        )}
      </div>
    </div>
  );
}
