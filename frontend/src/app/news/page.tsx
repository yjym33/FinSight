'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Zap } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useNews } from '@/features/news/hooks/useNews';
import { Header } from '@/shared/components/layout/Header';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { NewsList } from '@/features/news/components/NewsList';

export default function NewsPage() {
  const router = useRouter();
  const { accessToken, _hasHydrated } = useAuthStore();
  
  const THEMES = [
    { id: '전체', label: '전체' },
    { id: '금융', label: '금융' },
    { id: '증권', label: '증권' },
    { id: '산업', label: '산업' },
    { id: '재계', label: '재계' },
    { id: '경제', label: '경제' },
    { id: '부동산', label: '부동산' },
  ];

  const [activeTheme, setActiveTheme] = useState(THEMES[0].id);
  
  // Custom hook usage with active theme
  const { news, isLoading, realtimeNews, clearRealtimeNews } = useNews(activeTheme === '전체' ? undefined : activeTheme);

  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.push('/login');
    }
  }, [accessToken, _hasHydrated, router]);

  if (!_hasHydrated || !accessToken) return null;

  return (
    <div className="flex min-h-screen bg-toss-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="mx-auto w-full max-w-[1200px] p-8 pb-20">
          <header className="mb-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-toss-blue/10 text-toss-blue">
                    <Newspaper className="h-5 w-5" />
                  </div>
                  <h1 className="text-[28px] font-bold text-toss-text-primary">오늘의 뉴스</h1>
                </div>
                <p className="mt-1 text-[16px] text-toss-text-secondary">네이버 뉴스를 테마별로 정리해 드립니다</p>
              </div>
              
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">
                <Zap className="h-4 w-4 text-toss-blue fill-toss-blue" />
                <span className="text-[14px] font-bold text-toss-text-primary">실시간 분석 중</span>
                <div className="flex gap-1 ml-1">
                  {[0, 0.2, 0.4].map((delay) => (
                    <motion.div 
                      key={delay}
                      animate={{ opacity: [0.3, 1, 0.3] }} 
                      transition={{ repeat: Infinity, duration: 1.5, delay }}
                      className="h-1 w-1 rounded-full bg-toss-blue" 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Theme Tabs */}
            <div className="flex gap-6 border-b border-gray-100 overflow-x-auto no-scrollbar">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  className={cn(
                    'pb-4 px-1 text-[18px] font-bold transition-all relative whitespace-nowrap',
                    activeTheme === theme.id ? 'text-toss-blue' : 'text-toss-text-placeholder hover:text-toss-text-secondary'
                  )}
                >
                  {theme.label}
                  {activeTheme === theme.id && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-toss-blue rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTheme}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {realtimeNews.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between rounded-2xl bg-toss-blue p-5 text-white shadow-lg shadow-toss-blue/20">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 fill-white" />
                      <span className="text-[16px] font-bold">
                        새로운 {activeTheme} 뉴스 {realtimeNews.length}건이 도착했어요!
                      </span>
                    </div>
                    <button 
                      onClick={clearRealtimeNews}
                      className="text-[14px] font-bold underline-offset-4 hover:underline"
                    >
                      지금 확인하기
                    </button>
                  </div>
                </div>
              )}

            {isLoading ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-toss-blue border-t-transparent" />
                <p className="font-bold text-toss-text-secondary">잠시만 기다려주세요</p>
              </div>
            ) : (
              <NewsList news={[...realtimeNews, ...(news || [])]} />
            )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
