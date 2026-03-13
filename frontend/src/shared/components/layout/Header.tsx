'use client';

import { Search, Bell, User as UserIcon, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/shared/components/ui/Button';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-gray-100 bg-white/80 px-8 backdrop-blur-md">
      <div className="flex w-full max-w-lg items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-toss-text-placeholder" />
          <input 
            type="text" 
            placeholder="관심주식을 검색해보세요"
            className="h-11 w-full rounded-full bg-toss-bg pl-12 pr-4 text-[15px] outline-none transition-all focus:ring-2 focus:ring-toss-blue/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-toss-text-secondary hover:text-toss-text-primary transition-colors">
          <Bell className="h-6 w-6" />
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
        
        <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
          <div className="flex flex-col items-end">
            <span className="text-[14px] font-bold text-toss-text-primary">{user?.nickname || '사용자'}</span>
            <span className="text-[12px] text-toss-text-secondary">내 계정</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-toss-bg">
            <UserIcon className="h-5 w-5 text-toss-text-secondary" />
          </div>
          <button 
            onClick={handleLogout}
            className="ml-2 text-toss-text-secondary hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
            title="로그아웃"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
