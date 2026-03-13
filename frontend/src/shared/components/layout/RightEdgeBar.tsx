'use client';

import { useGlobalSidebarStore } from '@/shared/store/sidebarStore';
import { Heart, Clock, TrendingUp, Wallet, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { usePathname } from 'next/navigation';

export function RightEdgeBar() {
  const { activeTab, toggleTab, isOpen } = useGlobalSidebarStore();
  const pathname = usePathname();

  const buttons = [
    { id: 'watchlist', icon: Heart, label: '관심' },
    { id: 'recent', icon: Clock, label: '최근' },
    { id: 'realtime', icon: TrendingUp, label: '실시간' },
  ] as const;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-[60px] flex-col items-center border-l border-gray-100 bg-white py-8 shadow-[-1px_0_0_rgb(0,0,0,0.02)]">
      <div className="flex flex-col gap-6">
        {buttons.map((btn) => {
          const isActive = activeTab === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => toggleTab(btn.id)}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 transition-all",
                isActive ? "text-toss-blue" : "text-toss-text-secondary hover:text-toss-text-primary"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                isActive ? "bg-toss-blue/10" : "group-hover:bg-toss-bg"
              )}>
                <btn.icon className={cn("h-6 w-6", isActive ? "fill-toss-blue" : "")} />
              </div>
              <span className="text-[10px] font-bold">{btn.label}</span>
              
              {isActive && (
                <div className="absolute -left-[1px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-toss-blue" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pointer-events-none opacity-20">
         <span className="text-[10px] font-bold text-gray-400 rotate-90 whitespace-nowrap mb-8 block">INVEST</span>
      </div>
    </div>
  );
}
