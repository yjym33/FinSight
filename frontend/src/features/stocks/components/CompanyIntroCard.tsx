'use client';

import { Info, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { stocksService } from '@/features/stocks/services/stocksService';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanyIntroCardProps {
  stockCode: string;
  stockName: string;
}

export function CompanyIntroCard({ stockCode, stockName }: CompanyIntroCardProps) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['stocks', 'analysis', stockCode],
    queryFn: () => stocksService.getStockAnalysis(stockCode),
    enabled: !!stockCode,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-toss-large p-8 shadow-toss border border-gray-100 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!analysis?.description) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-toss-large p-8 shadow-toss border border-gray-100 dark:border-slate-800 mb-6 group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-toss-blue opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-toss-blue/10 rounded-lg">
          <Building2 className="h-4 w-4 text-toss-blue" />
        </div>
        <h4 className="text-[17px] font-bold text-toss-text-primary">기업 개요</h4>
      </div>

      <div className="relative">
        <p className="text-[15px] leading-relaxed text-toss-text-secondary font-medium dark:text-slate-300">
          <span className="text-toss-blue font-bold mr-1">{stockName}</span>은(는) {analysis.description}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <Info className="h-3 w-3" />
        AI가 뉴스 및 공시를 바탕으로 분석한 사업 요약입니다.
      </div>
    </motion.div>
  );
}
