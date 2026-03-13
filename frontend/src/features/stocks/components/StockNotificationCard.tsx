'use client';

import { useState } from 'react';
import { Bell, BellOff, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface StockNotificationCardProps {
  stockName: string;
}

export function StockNotificationCard({ stockName }: StockNotificationCardProps) {
  const [isPriceAlert, setIsPriceAlert] = useState(false);
  const [isNewsAlert, setIsNewsAlert] = useState(true);

  return (
    <div className="bg-white rounded-toss-large p-8 shadow-toss border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[17px] font-bold text-toss-text-primary">실시간 알림</h4>
        <div className={cn(
          "p-2 rounded-full transition-colors",
          isPriceAlert || isNewsAlert ? "bg-toss-blue/10 text-toss-blue" : "bg-gray-100 text-toss-text-placeholder"
        )}>
          {isPriceAlert || isNewsAlert ? <Bell className="h-5 w-5 fill-current" /> : <BellOff className="h-5 w-5" />}
        </div>
      </div>

      <div className="space-y-4">
        {/* Price Alert Toggle */}
        <div 
          onClick={() => setIsPriceAlert(!isPriceAlert)}
          className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
        >
          <div>
            <p className="text-[14px] font-bold text-toss-text-primary">현재가 도달 알림</p>
            <p className="text-[12px] text-toss-text-placeholder mt-0.5">원하는 가격이 되면 알려드려요</p>
          </div>
          <div className={cn(
            "w-10 h-6 rounded-full relative transition-colors p-1",
            isPriceAlert ? "bg-toss-blue" : "bg-gray-200"
          )}>
            <motion.div 
              animate={{ x: isPriceAlert ? 16 : 0 }}
              className="w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </div>
        </div>

        {/* News Alert Toggle */}
        <div 
          onClick={() => setIsNewsAlert(!isNewsAlert)}
          className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
        >
          <div>
            <p className="text-[14px] font-bold text-toss-text-primary">주요 뉴스 알림</p>
            <p className="text-[12px] text-toss-text-placeholder mt-0.5">{stockName}의 큰 뉴스를 놓치지 마세요</p>
          </div>
          <div className={cn(
            "w-10 h-6 rounded-full relative transition-colors p-1",
            isNewsAlert ? "bg-toss-blue" : "bg-gray-200"
          )}>
            <motion.div 
              animate={{ x: isNewsAlert ? 16 : 0 }}
              className="w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </div>
        </div>
      </div>

      <button className="w-full mt-6 py-4 bg-toss-bg text-toss-text-secondary font-bold text-[14px] rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
        상세 알림 설정하기 <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
