'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { stocksService } from '@/features/stocks/services/stocksService';
import { motion } from 'framer-motion';
import { useTheme } from '@/shared/providers/ThemeProvider';

interface InvestorTrendCardProps {
  stockCode: string;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

const TrendBar = ({ label, value, maxAbsValue, chartColorStyle }: { label: string; value: number; maxAbsValue: number; chartColorStyle: string }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  // Calculate colors based on style
  const upColor = chartColorStyle === 'kr' ? '#F04452' : '#00D084';
  const downColor = chartColorStyle === 'kr' ? '#3182F6' : '#F04452';
  const activeColor = isPositive ? upColor : isNegative ? downColor : '#ADB5BD';
  const textColorClass = isPositive 
    ? (chartColorStyle === 'kr' ? 'text-toss-red' : 'text-toss-green')
    : isNegative 
      ? (chartColorStyle === 'kr' ? 'text-toss-blue' : 'text-toss-red')
      : 'text-toss-text-placeholder';
  
  // Calculate width percentage relative to the maximum absolute value
  const widthPercent = maxAbsValue === 0 ? 0 : Math.min(100, Math.max(0, (Math.abs(value) / maxAbsValue) * 100));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-[13px]">
        <span className="text-toss-text-secondary">{label}</span>
        <span className={`font-bold ${textColorClass}`}>
          {isPositive && '+'}
          {formatNumber(value)}주
        </span>
      </div>
      <div className="w-full h-[6px] bg-toss-bg rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-0 bottom-0"
          style={{ 
            backgroundColor: activeColor,
            left: isPositive ? 0 : 'auto',
            right: isNegative ? 0 : 'auto'
          }}
        />
      </div>
    </div>
  );
};

export const InvestorTrendCard: React.FC<InvestorTrendCardProps> = ({ stockCode }) => {
  const { settings } = useTheme();
  const { data: trendData, isLoading } = useQuery({
    queryKey: ['investorTrend', stockCode],
    queryFn: () => stocksService.getInvestorTrend(stockCode),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Render nothing or a skeleton while loading
  if (isLoading) {
    return (
      <div className="mt-8 bg-white rounded-toss-large p-8 shadow-toss border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-1.5">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-full h-[6px] bg-gray-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If the API returns null (e.g., for overseas stocks), we can hide it or return a fallback
  if (!trendData) {
    return null;
  }

  const chartColorStyle = settings?.chartColorStyle || 'kr';

  // Find max value to scale the bars proportionally
  const maxAbsValue = Math.max(
    Math.abs(trendData.retail),
    Math.abs(trendData.foreigner),
    Math.abs(trendData.institution),
    1 // Prevent division by zero
  );

  // Parse original date "YYYYMMDD"
  const formattedDate = trendData.date && trendData.date.length === 8 
    ? `${trendData.date.slice(0, 4)}.${trendData.date.slice(4, 6)}.${trendData.date.slice(6, 8)}` 
    : '최근';

  return (
    <div className="mt-8 bg-white rounded-toss-large p-8 shadow-toss border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[17px] font-bold text-toss-text-primary">투자자 매매동향</h4>
        <span className="text-[12px] text-toss-text-secondary">{formattedDate} 기준</span>
      </div>
      
      <div className="space-y-5">
        <TrendBar label="개인" value={trendData.retail} maxAbsValue={maxAbsValue} chartColorStyle={chartColorStyle} />
        <TrendBar label="외국인" value={trendData.foreigner} maxAbsValue={maxAbsValue} chartColorStyle={chartColorStyle} />
        <TrendBar label="기관" value={trendData.institution} maxAbsValue={maxAbsValue} chartColorStyle={chartColorStyle} />
      </div>
    </div>
  );
};
