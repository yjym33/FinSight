'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Zap, Clock, ExternalLink, Filter, TrendingUp, Search } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useNews } from '@/features/news/hooks/useNews';
import { Header } from '@/shared/components/layout/Header';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { NewsList } from '@/features/news/components/NewsList';

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [fundamentalOnly, setFundamentalOnly] = useState(false);
  
  // Custom hook usage with active theme, search query and fundamental filter
  const { news, isLoading, realtimeNews, clearRealtimeNews } = useNews(
    activeTheme === '전체' ? undefined : activeTheme,
    searchQuery,
    fundamentalOnly
  );

  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.push('/login');
    }
  }, [accessToken, _hasHydrated, router]);

  if (!_hasHydrated || !accessToken) return null;

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="mx-auto w-full max-w-[1200px] p-6 lg:p-12 pb-20">
          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-toss-blue/10 text-toss-blue border-none font-bold px-3 py-1">Stock News AI</Badge>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">시장 인사이트</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">가장 빠르고 정확한 투자 뉴스를 AI가 분석해 드립니다.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 rounded-[24px] bg-white dark:bg-slate-900/50 px-6 py-4 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-all hover:scale-105">
                <div className="relative">
                  <Zap className="h-5 w-5 text-toss-blue fill-toss-blue" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-toss-blue opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-toss-blue"></span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Live Monitor</span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">실시간 데이터 수집 중</span>
                </div>
              </div>
            </div>

            <Tabs value={activeTheme} onValueChange={setActiveTheme} className="w-full">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar">
                <TabsList className="bg-transparent dark:bg-transparent h-auto p-0 gap-8">
                  {THEMES.map((theme) => (
                    <TabsTrigger
                      key={theme.id}
                      value={theme.id}
                      className="pb-4 px-1 text-lg font-bold rounded-none border-b-2 border-transparent text-slate-400 dark:text-slate-500 data-[state=active]:border-toss-blue data-[state=active]:text-toss-blue data-[state=active]:bg-transparent transition-all hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      {theme.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="hidden md:flex items-center gap-4">
                   <div className={cn(
                     "flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm",
                     isSearchVisible || searchQuery 
                       ? "w-[320px] border-toss-blue ring-2 ring-toss-blue/10" 
                       : "w-10 overflow-hidden cursor-pointer border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                   )}
                   onClick={() => !isSearchVisible && setIsSearchVisible(true)}
                   >
                      <Search className={cn("h-4 w-4 flex-shrink-0", searchQuery ? "text-toss-blue" : "text-slate-400")} />
                      <input 
                        type="text"
                        placeholder="회사명 또는 키워드 검색"
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-slate-100 w-full placeholder:text-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => !searchQuery && setIsSearchVisible(false)}
                        autoFocus={isSearchVisible}
                      />
                      {searchQuery && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery('');
                          }}
                          className="h-4 w-4 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          <span className="text-[10px] whitespace-nowrap">✕</span>
                        </button>
                      )}
                   </div>
                   <Button 
                     variant={fundamentalOnly ? "secondary" : "ghost"}
                     size="sm" 
                     className={cn(
                       "rounded-xl font-bold transition-all gap-2",
                       fundamentalOnly 
                        ? "bg-toss-blue/10 text-toss-blue hover:bg-toss-blue/20" 
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                     )}
                     onClick={() => setFundamentalOnly(!fundamentalOnly)}
                   >
                     <Filter className="h-4 w-4" />
                     {fundamentalOnly ? "사업/공시 중심" : "필터"}
                   </Button>
                </div>
              </div>
            </Tabs>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTheme}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {realtimeNews.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10"
                >
                  <Card className="border-none bg-gradient-to-r from-toss-blue to-blue-500 text-white shadow-2xl shadow-toss-blue/30 rounded-[32px] overflow-hidden group">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          <Zap className="h-7 w-7 fill-white" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-black">새로운 {activeTheme} 뉴스가 도착했어요!</p>
                          <p className="text-white/80 font-medium">방금 수집된 소식 {realtimeNews.length}건을 지금 바로 확인해 보세요.</p>
                        </div>
                      </div>
                      <Button 
                        onClick={clearRealtimeNews}
                        className="bg-white text-toss-blue hover:bg-white/90 font-black rounded-2xl px-8 h-12 shadow-lg"
                      >
                        내용 보기
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-[40px] shadow-sm" />
                ))}
              </div>
            ) : news && news.length > 0 ? (
              <NewsList news={news} />
            ) : (
              <Card className="p-20 border-none bg-white dark:bg-slate-900/50 rounded-[48px] text-center shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
                   <TrendingUp className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                </div>
                <h3 className="text-2xl font-black mb-2">아직 관련 소식이 없네요</h3>
                <p className="text-slate-500 font-medium">전체 뉴스를 확인하거나 다른 테마를 선택해 보세요.</p>
                 <Button 
                   onClick={() => setActiveTheme('전체')}
                   variant="secondary" 
                   className="mt-10 rounded-2xl px-10 py-6 h-auto font-black"
                 >
                   전체 뉴스로 돌아가기
                 </Button>
              </Card>
            )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
