'use client';

import { useQuery } from '@tanstack/react-query';
import { stocksService } from '../services/stocksService';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ThemeClustering() {
  const router = useRouter();
  const { data: themes, isLoading } = useQuery({
    queryKey: ['market-themes'],
    queryFn: stocksService.getThemes,
    staleTime: 15 * 60 * 1000,
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Leading Theme (Featured) */}
      <motion.div
        className="lg:col-span-12 xl:col-span-5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="relative overflow-hidden h-full p-10 border-none bg-gradient-to-br from-toss-blue to-blue-700 dark:from-blue-600 dark:to-indigo-900 text-white rounded-[40px] shadow-2xl shadow-blue-500/20 group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Zap className="h-40 w-40" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-none hover:bg-white/30 backdrop-blur-md px-4 py-1.5 rounded-full font-black tracking-widest text-[10px] uppercase">TOP LEADER</Badge>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              {themes[0].theme}
            </h2>
            
            <p className="text-blue-50/80 text-lg font-medium leading-relaxed max-w-md">
              {themes[0].reason}
            </p>

            <div className="pt-4 flex flex-wrap gap-3">
              {themes[0].stocks.map((stock: string) => (
                <button 
                  key={stock}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-sm font-bold border border-white/10 transition-all"
                >
                  {stock}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${themes[0].strength}%` }}
              className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            />
          </div>
        </Card>
      </motion.div>

      {/* Secondary Themes Grid */}
      <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.slice(1, 5).map((item, idx) => (
          <motion.div
            key={item.theme}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-8 h-full border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[32px] hover:border-toss-blue/30 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="h-1 w-12 bg-toss-blue/20 rounded-full overflow-hidden">
                    <div className="h-full bg-toss-blue" style={{ width: `${item.strength}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Strength {item.strength}%</span>
                </div>
                <Info className="h-4 w-4 text-slate-300 group-hover:text-toss-blue transition-colors" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {item.theme}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 font-medium leading-relaxed">
                {item.reason}
              </p>

              <div className="flex flex-wrap gap-2">
                {item.stocks.slice(0, 2).map((stock: string) => (
                  <span key={stock} className="px-3 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
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
