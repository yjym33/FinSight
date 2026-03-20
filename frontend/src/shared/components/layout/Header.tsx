'use client';

import { Search, Bell, User as UserIcon, Command, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const router = useRouter();
  const { user } = useAuthStore();


  return (
    <header className="sticky top-0 z-40 flex h-24 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-10 backdrop-blur-xl">
      <div className="flex w-full max-w-[500px] items-center gap-3">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-toss-blue transition-colors" />
          <Input 
            placeholder="어떤 종목을 찾으시나요?"
            className="h-12 w-full rounded-2xl border-none bg-slate-100 dark:bg-slate-800/50 pl-11 pr-12 text-sm font-bold outline-none transition-all placeholder:text-slate-400 focus-visible:ring-toss-blue/30"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none">
             <Command className="h-3 w-3 text-slate-400" />
             <span className="text-[10px] font-black text-slate-400">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Bell className="h-5 w-5" />
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-toss-blue ring-4 ring-white dark:ring-slate-950" />
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Settings className="h-5 w-5" />
            </Button>
        </div>
        
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center gap-4 pl-2">
          <div className="flex flex-col items-end">
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">{user?.nickname || '사용자'}</span>
            <Badge variant="secondary" className="px-2 py-0 text-[10px] font-black uppercase tracking-tighter bg-toss-blue/10 text-toss-blue border-none">Pro Member</Badge>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-inner flex items-center justify-center border border-slate-200 dark:border-slate-800 group cursor-pointer hover:scale-105 transition-all">
            <UserIcon className="h-6 w-6 text-slate-400 group-hover:text-toss-blue transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
}
