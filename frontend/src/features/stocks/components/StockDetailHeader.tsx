'use client';

import { ArrowUp, ArrowDown, Bell } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { WatchlistStar } from '@/features/stocks/components/WatchlistStar';
import { useTheme } from '@/shared/providers/ThemeProvider';

interface StockDetailHeaderProps {
  name: string;
  code: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  high52?: number;
  low52?: number;
}

export function StockDetailHeader({
  name,
  code,
  currentPrice,
  change,
  changePercent,
  high,
  low,
  high52,
  low52,
}: StockDetailHeaderProps) {
  const { settings } = useTheme();
  const isUp = change >= 0;

  const getStatusColorClass = (up: boolean) => {
    const style = settings?.chartColorStyle || 'kr';
    if (style === 'kr') {
      return up ? 'text-toss-red' : 'text-toss-blue';
    } else {
      return up ? 'text-toss-green' : 'text-toss-red';
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[32px] font-bold text-toss-text-primary">{name}</h1>
          <span className="text-[14px] font-medium text-toss-text-placeholder mt-2">{code}</span>
        </div>
        <div className="flex items-center gap-2">
           <WatchlistStar 
             stockCode={code} 
             className="p-3" 
             iconClassName="h-6 w-6" 
           />
           <button className="p-3 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="h-6 w-6 text-toss-text-secondary" />
           </button>
        </div>
      </div>

      <div className="flex items-end gap-10">
        <div className="space-y-1">
          <div className="text-[36px] font-extrabold text-toss-text-primary">
            {currentPrice.toLocaleString()}원
          </div>
          <div className={cn(
            "flex items-center gap-1.5 text-[16px] font-bold",
            getStatusColorClass(isUp)
          )}>
            {isUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span>{Math.abs(change).toLocaleString()}원 ({isUp ? '+' : '-'}{Math.abs(changePercent)}%)</span>
          </div>
        </div>

        {/* Small stats on the right if available */}
        <div className="flex gap-10 border-l border-gray-100 pl-10 mb-1">
           <div className="space-y-0.5">
              <p className="text-[12px] font-medium text-toss-text-placeholder uppercase tracking-wider">고가/저가</p>
              <p className="text-[14px] font-bold text-toss-text-secondary">
                {high?.toLocaleString() || '-'} / {low?.toLocaleString() || '-'}
              </p>
           </div>
           <div className="space-y-0.5">
              <p className="text-[12px] font-medium text-toss-text-placeholder uppercase tracking-wider">52주 최고/최저</p>
              <p className="text-[14px] font-bold text-toss-text-secondary">
                {high52?.toLocaleString() || '-'} / {low52?.toLocaleString() || '-'}
              </p>
           </div>
        </div>
      </div>
      
      {/* Navigation tabs similar to Toss */}
      <div className="mt-10 flex gap-8 border-b border-gray-100">
          {['차트 / 주문', '종목정보', '뉴스 / 공시', '거래현황', '커뮤니티'].map((tab, i) => (
            <button 
              key={tab}
              className={cn(
                "pb-4 text-[16px] font-bold border-b-[3px] transition-all",
                i === 0 ? "border-toss-text-primary text-toss-text-primary" : "border-transparent text-toss-text-secondary hover:text-toss-text-primary"
              )}
            >
              {tab}
            </button>
          ))}
      </div>
    </div>
  );
}
