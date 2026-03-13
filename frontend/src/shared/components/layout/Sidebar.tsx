import { LayoutDashboard, Newspaper, MessageSquare, Heart, Settings, Wallet, BarChart2, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { useGlobalSidebarStore } from '@/shared/store/sidebarStore';

const menuItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/compare', label: '종목 비교', icon: BarChart2 },
  { href: '/news', label: '뉴스', icon: Newspaper },
  { href: '/community', label: '커뮤니티', icon: Users },
  { href: '/chat', label: '투자봇', icon: MessageSquare },
  { href: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { toggleTab } = useGlobalSidebarStore();

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-gray-100 bg-white shadow-[1px_0_0_rgb(0,0,0,0.02)]">
      <div className="flex h-20 items-center px-8">
        <span className="text-[22px] font-bold tracking-tight text-toss-blue">Fin</span>
        <span className="ml-1 text-[22px] font-bold tracking-tight text-toss-text-primary">Sight</span>
      </div>

      <nav className="flex-1 space-y-1.5 p-5">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-4 rounded-toss-base px-4 py-4 text-[17px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-toss-bg text-toss-blue'
                  : 'text-toss-text-secondary hover:bg-toss-bg/60 hover:text-toss-text-primary'
              )}
            >
              <Icon 
                className={cn(
                  'h-6 w-6 transition-colors',
                  isActive ? 'text-toss-blue' : 'text-toss-text-secondary group-hover:text-toss-text-primary'
                )} 
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="rounded-2xl bg-toss-bg p-5">
          <p className="text-[14px] font-bold text-toss-text-primary">오늘의 AI 분석</p>
          <p className="mt-1 text-[13px] text-toss-text-secondary">시장의 흐름을 분석해드릴까요?</p>
          <button className="mt-3 text-[13px] font-bold text-toss-blue" onClick={() => window.location.href='/chat'}>분석 시작하기</button>
        </div>
      </div>
    </aside>
  );
}
