'use client';

import { 
  LayoutDashboard, 
  Newspaper, 
  MessageSquare, 
  Settings, 
  BarChart2, 
  Users, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { useGlobalSidebarStore } from '@/shared/store/sidebarStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/themes', label: '테마 분석', icon: Zap },
  { href: '/compare', label: '종목 비교', icon: BarChart2 },
  { href: '/news', label: '매크로 뉴스', icon: Newspaper, badge: 'New' },
  { href: '/community', label: '커뮤니티', icon: Users },
  { href: '/chat', label: 'AI 분석봇', icon: BrainCircuit },
  { href: '/settings', label: '개인 설정', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { toggleTab } = useGlobalSidebarStore();

  return (
    <aside className="sticky top-0 hidden lg:flex h-screen w-[300px] flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl z-40 transition-all">
      <div className="flex h-24 items-center px-10">
        <div className="flex items-center gap-3 group cursor-pointer">
           <div className="h-10 w-10 bg-toss-blue rounded-2xl flex items-center justify-center shadow-lg shadow-toss-blue/20 group-hover:rotate-12 transition-transform">
              <TrendingUp className="h-6 w-6 text-white" />
           </div>
           <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase" onClick={() => window.location.href='/dashboard'}>FinSight</span>
              <span className="text-[10px] font-black tracking-[0.2em] text-toss-blue uppercase">Pro Terminal</span>
           </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-6 py-8">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center justify-between rounded-2xl px-5 py-4 text-[15px] font-black transition-all duration-300',
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <div className="flex items-center gap-4">
                <Icon 
                  className={cn(
                    'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
                    isActive ? 'text-toss-blue fill-toss-blue/10' : 'text-slate-400'
                  )} 
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge className={cn(
                  "px-2 py-0 text-[10px] uppercase font-black border-none",
                  isActive ? "bg-white/20 text-white" : "bg-toss-blue text-white"
                )}>
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-50 dark:bg-slate-800/80 p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="absolute -top-4 -right-4 h-24 w-24 bg-toss-blue/5 rounded-full blur-2xl" />
          <div className="relative space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-toss-blue/10 dark:bg-slate-700/50 backdrop-blur-md">
               <Sparkles className="h-5 w-5 text-toss-blue dark:text-yellow-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black whitespace-nowrap text-slate-900 dark:text-slate-100">AI 시장 요약</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">준비된 분석이 있습니다.<br/>확인하시겠어요?</p>
            </div>
            <Button 
                variant="secondary" 
                size="sm" 
                className="w-full rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold border border-slate-100 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 gap-2 h-9 text-xs transition-colors"
                onClick={() => window.location.href='/chat'}
            >
              요약본 보기
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
