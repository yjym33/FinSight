'use client';

import { Sparkles, TrendingUp, TrendingDown, Target, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { stocksService } from '@/features/stocks/services/stocksService';
import { useTheme } from '@/shared/providers/ThemeProvider';

interface AIStockAnalysisCardProps {
  stockCode: string;
  stockName: string;
  changePercent: number;
}

export function AIStockAnalysisCard({ stockCode, stockName, changePercent }: AIStockAnalysisCardProps) {
  const { settings } = useTheme();
  const isPositive = changePercent >= 0;

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['stocks', 'analysis', stockCode],
    queryFn: () => stocksService.getStockAnalysis(stockCode),
    enabled: !!stockCode,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-toss-large p-8 shadow-toss border border-gray-100 mb-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 text-toss-blue animate-spin mb-4" />
        <p className="text-toss-text-secondary font-medium text-[14px]">AI가 종목뉴스와 시세를 분석 중입니다...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-toss-large p-8 shadow-toss border border-gray-100 mb-6 text-center">
        <p className="text-toss-text-secondary font-medium text-[14px]">AI 분석 결과를 가져올 수 없습니다.</p>
      </div>
    );
  }

  const chartColorStyle = settings?.chartColorStyle || 'kr';
  const upColorClass = chartColorStyle === 'kr' ? 'text-toss-red' : 'text-toss-green';
  const downColorClass = chartColorStyle === 'kr' ? 'text-toss-blue' : 'text-toss-red';

  const icons = [
    <Target className="h-4 w-4 text-purple-500" />,
    <Zap className="h-4 w-4 text-amber-500" />,
    isPositive ? <TrendingUp className={cn("h-4 w-4", upColorClass)} /> : <TrendingDown className={cn("h-4 w-4", downColorClass)} />,
  ];

  return (
    <div className="bg-white rounded-toss-large p-8 shadow-toss border border-gray-100 mb-6 relative overflow-hidden group">
      {/* Decorative gradient background that works in both themes */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 via-transparent to-purple-50/20 dark:from-purple-900/10 dark:to-transparent pointer-events-none" />

      {/* AI Badge */}
      <div className="absolute top-0 right-0 p-4">
        <div className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm">
           <Sparkles className="h-3 w-3" /> AI 분석 완료
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <h4 className="text-[17px] font-bold text-toss-text-primary">AI 투자 포인트 요약</h4>
      </div>

      <div className="space-y-6">
        {analysis.points.map((point, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="flex gap-4"
          >
            <div className="mt-1 shrink-0 bg-toss-bg p-2 rounded-xl border border-gray-100">
              {icons[idx] || icons[2]}
            </div>
            <p className="text-[14px] leading-relaxed text-toss-text-secondary font-medium">
              {point}
            </p>
          </motion.div>
        ))}
      </div>

      {/* AI Score */}
      <div className="mt-8 pt-6 border-t border-purple-100 dark:border-purple-900/30">
        <div className="flex justify-between items-center mb-2">
           <span className="text-[13px] text-toss-text-secondary font-bold">AI 오늘의 매력도</span>
           <span className="text-[18px] font-bold text-purple-600 dark:text-purple-400">{analysis.score}점</span>
        </div>
        <div className="w-full h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${analysis.score}%` }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="h-full bg-gradient-to-r from-purple-400 to-purple-600" 
           />
        </div>
        <p className="text-[11px] text-toss-text-placeholder mt-2">
          ※ AI 분석 결과는 해당 종목의 뉴스 및 시세를 OpenAI GPT-4o-mini 엔진으로 분석한 결과입니다.
        </p>
      </div>
    </div>
  );
}
