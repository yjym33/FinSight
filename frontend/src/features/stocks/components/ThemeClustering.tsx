'use client';

import { useQuery } from '@tanstack/react-query';
import { stocksService } from '../services/stocksService';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, Info, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ThemeClustering() {
  const router = useRouter();
  const { data: themes, isLoading } = useQuery({
    queryKey: ['market-themes'],
    queryFn: stocksService.getThemes,
    staleTime: 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 rounded-[32px] bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!themes || themes.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Leading Theme (Featured) */}
      <motion.div
        className="lg:col-span-12 xl:col-span-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="relative overflow-hidden h-full p-6 border-none bg-gradient-to-br from-toss-blue to-blue-700 dark:from-blue-600 dark:to-indigo-900 text-white rounded-3xl shadow-xl shadow-blue-500/10 group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Zap className="h-24 w-24" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-white/20 text-white border-none hover:bg-white/30 backdrop-blur-md px-3 py-1 rounded-full font-black tracking-widest text-[9px] uppercase">TOP LEADER</Badge>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-black tracking-tight leading-tight">
              {themes[0].theme}
            </h2>
            
            <p className="text-blue-50/80 text-sm font-medium leading-relaxed max-w-md line-clamp-2">
              {themes[0].reason}
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              {themes[0].stocks.map((stock: string) => (
                <button 
                  key={stock}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold border border-white/10 transition-all"
                >
                  {stock}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${themes[0].strength}%` }}
              className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            />
          </div>
        </Card>
      </motion.div>

      {/* Secondary Themes Grid */}
      <div className="lg:col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes.slice(1, 4).map((item, idx) => (
          <motion.div
            key={item.theme}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-5 h-full border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl hover:border-toss-blue/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="h-1 w-10 bg-toss-blue/20 rounded-full overflow-hidden">
                    <div className="h-full bg-toss-blue" style={{ width: `${item.strength}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Strength {item.strength}%</span>
                </div>
                <Info className="h-3.5 w-3.5 text-slate-300 group-hover:text-toss-blue transition-colors" />
              </div>
              
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                {item.theme}
              </h3>
              
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 font-medium leading-relaxed">
                {item.reason}
              </p>

              <div className="flex flex-wrap gap-2">
                {item.stocks.slice(0, 2).map((stock: string) => (
                  <span key={stock} className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {stock}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
