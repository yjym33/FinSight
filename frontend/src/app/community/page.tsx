'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService, CommunityPost } from '@/features/community/services/communityService';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Eye, 
  ThumbsUp, 
  Search, 
  X,
  ChevronRight,
  TrendingUp,
  Filter,
  Edit3,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SearchResultList } from '@/features/stocks/components/SearchResultList';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function CommunityPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', stockCode: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isStockSearchOpen, setIsStockSearchOpen] = useState(false);

  const { data: posts, isLoading, refetch, isError } = useQuery({
    queryKey: ['community', 'posts'],
    queryFn: () => communityService.getPosts(),
  });

  const createPostMutation = useMutation({
    mutationFn: communityService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
      setIsWriteOpen(false);
      setNewPost({ title: '', content: '', stockCode: '' });
      setStockSearchQuery('');
      setSearchQuery(''); 
      refetch();
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    createPostMutation.mutate(newPost);
  };

  const filteredPosts = posts?.filter((post: CommunityPost) => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = post.title.toLowerCase().includes(searchLower);
    const authorMatch = post.author?.nickname?.toLowerCase().includes(searchLower) ?? false;
    const contentMatch = post.content.toLowerCase().includes(searchLower);
    return titleMatch || authorMatch || contentMatch;
  });

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="mx-auto w-full max-w-[1000px] p-6 lg:p-12 pb-20">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-toss-blue/10 text-toss-blue border-none font-bold px-3 py-1">Community Hub</Badge>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">인사이트 라운지</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">투자자들과 실시간 정보를 공유하고 소통하세요.</p>
            </div>
            
            <Dialog open={isWriteOpen} onOpenChange={setIsWriteOpen}>
              <DialogTrigger asChild>
                <Button 
                    className="rounded-2xl px-8 py-7 h-auto bg-toss-blue hover:bg-toss-blue/90 text-white font-black gap-3 shadow-xl shadow-toss-blue/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="h-6 w-6" />
                  글쓰기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[700px] p-0 border-none overflow-hidden rounded-[40px]">
                <form onSubmit={handleCreatePost} className="flex flex-col h-full max-h-[90vh]">
                  <DialogHeader className="p-10 pb-6 bg-slate-50 dark:bg-slate-900">
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
                       <Edit3 className="h-6 w-6 text-toss-blue" />
                       소중한 의견을 들려주세요
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium mt-2">
                      다른 투자자들에게 도움이 될 수 있는 클린한 정보를 공유해 주세요.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="p-10 py-6 space-y-8 overflow-y-auto">
                    <div className="space-y-3">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">연관 종목 (태그)</p>
                      <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                              placeholder="어떤 종목에 대한 이야기인가요?" 
                              value={stockSearchQuery || newPost.stockCode}
                              onChange={(e) => {
                                  setStockSearchQuery(e.target.value);
                                  setIsStockSearchOpen(true);
                                  if (!e.target.value) {
                                      setNewPost(prev => ({ ...prev, stockCode: '' }));
                                  }
                              }}
                              onFocus={() => setIsStockSearchOpen(true)}
                              className="rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 h-14 pl-11 focus-visible:ring-toss-blue/30"
                          />
                          {newPost.stockCode && (
                              <button 
                                  type="button"
                                  onClick={() => {
                                    setNewPost(prev => ({ ...prev, stockCode: '' }));
                                    setStockSearchQuery('');
                                  }}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-toss-blue text-white px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              >
                                  {newPost.stockCode} <X className="h-3 w-3" />
                              </button>
                          )}

                          <AnimatePresence>
                              {isStockSearchOpen && stockSearchQuery && !newPost.stockCode && (
                                  <motion.div 
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[110] max-h-[200px] overflow-y-auto"
                                  >
                                      <SearchResultList 
                                          query={stockSearchQuery} 
                                          onSelect={(stock: any) => {
                                              setNewPost(prev => ({ ...prev, stockCode: stock.code }));
                                              setStockSearchQuery(stock.name);
                                              setIsStockSearchOpen(false);
                                          }} 
                                      />
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">제목</p>
                      <Input 
                        placeholder="제목을 입력하세요 (예: 삼전 지금 사도 될까요?)" 
                        required
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        className="rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 h-14 font-bold focus-visible:ring-toss-blue/30"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">상세 내용</p>
                      <textarea 
                        placeholder="자유로운 생각이나 정보를 입력해 주세요."
                        required
                        rows={6}
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[28px] px-6 py-6 focus:ring-2 focus:ring-toss-blue/30 transition-all outline-none resize-none text-base font-medium text-slate-700 dark:text-slate-300 min-h-[200px]"
                      />
                    </div>
                  </div>

                  <DialogFooter className="p-10 pt-4 bg-slate-50 dark:bg-slate-900 flex sm:justify-between items-center gap-4">
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => setIsWriteOpen(false)}
                      className="rounded-2xl flex-1 h-14 font-bold text-slate-500"
                    >
                      나중에 작성
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createPostMutation.isPending}
                      className="rounded-2xl flex-1 bg-toss-blue hover:bg-toss-blue/90 text-white font-black h-14 shadow-lg shadow-toss-blue/20"
                    >
                      {createPostMutation.isPending ? (
                        <div className="flex items-center gap-2">
                           <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           등록 중...
                        </div>
                      ) : '등록하기'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          {/* Search & Filter Bar */}
          <div className="flex gap-4 mb-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-toss-blue transition-colors" />
              <Input 
                placeholder="검색어를 입력해 주세요 (제목, 작성자, 내용)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 bg-white dark:bg-slate-900 border-none rounded-[28px] pl-14 pr-14 text-base font-bold shadow-xl shadow-slate-200/50 dark:shadow-none focus-visible:ring-toss-blue/30 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
            <Button variant="outline" className="rounded-[28px] px-8 h-16 border-none bg-white dark:bg-slate-900 gap-3 text-slate-500 font-bold shadow-xl shadow-slate-200/50 dark:shadow-none hover:bg-slate-50 transition-all whitespace-nowrap">
              <Filter className="h-5 w-5" />
              필터링
            </Button>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-[40px] shadow-sm" />
              ))
            ) : isError ? (
              <Card className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-none shadow-xl shadow-slate-200/30">
                <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                   <X className="h-8 w-8" />
                </div>
                <p className="text-slate-900 dark:text-slate-100 font-black text-xl mb-2">데이터를 불러오지 못했습니다.</p>
                <p className="text-slate-500 font-medium mb-8">일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.</p>
                <Button onClick={() => refetch()} variant="secondary" className="rounded-2xl px-8 py-6 h-auto font-black flex gap-2">
                   새로고침
                </Button>
              </Card>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((post: any) => (
                <motion.div
                  key={post.id}
                  layoutId={post.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => router.push(`/community/posts/${post.id}`)}
                  className="cursor-pointer"
                >
                  <Card className="rounded-[40px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none dark:bg-slate-900/60 backdrop-blur-sm overflow-hidden group hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="p-10 pb-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-4">
                                {post.stockCode && (
                                    <Badge className="bg-gradient-to-tr from-toss-blue to-blue-400 text-white font-black px-4 py-2 rounded-xl border-none shadow-lg shadow-toss-blue/20">
                                        <Hash className="h-3 w-3 mr-1" />
                                        {post.stockCode}
                                    </Badge>
                                )}
                                <h3 className="text-[22px] font-black text-slate-900 dark:text-slate-50 group-hover:text-toss-blue transition-colors duration-300 leading-snug tracking-tight">
                                    {post.title}
                                </h3>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-toss-blue group-hover:text-white transition-all duration-500 shadow-inner">
                               <ChevronRight className="h-6 w-6" />
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-10 pt-2">
                        <p className="text-slate-500 dark:text-slate-400 text-base font-medium line-clamp-2 leading-relaxed mb-10">
                            {post.content}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-xs font-black text-slate-500">
                                    {post.author?.nickname?.[0] || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                       <User className="h-3 w-3 text-toss-blue" />
                                       {post.author?.nickname || '익명'}
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                                       <Calendar className="h-3 w-3" />
                                       {new Date(post.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-400 group/item">
                                    <div className="p-2 rounded-xl group-hover/item:bg-blue-50 dark:group-hover/item:bg-blue-900/10 transition-colors">
                                       <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-black">{post.commentCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 group/item">
                                    <div className="p-2 rounded-xl group-hover/item:bg-rose-50 dark:group-hover/item:bg-rose-900/10 transition-colors">
                                       <ThumbsUp className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-black">{post.likeCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 group/item">
                                    <div className="p-2 rounded-xl group-hover/item:bg-slate-100 dark:group-hover/item:bg-slate-800 transition-colors">
                                       <Eye className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-black">{post.viewCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[48px] border border-dashed border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/30">
                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-10 shadow-inner">
                  <TrendingUp className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                </div>
                <h3 className="text-[22px] font-black text-slate-900 dark:text-slate-100 mb-2">아직 빈 공간이네요</h3>
                <p className="text-slate-500 font-medium mb-12">당신의 특별한 투자 인사이트를 가장 먼저 공유해 보세요.</p>
                <Button onClick={() => setIsWriteOpen(true)} className="rounded-2xl px-12 py-7 h-auto bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 font-black flex gap-3 hover:scale-105 active:scale-95 transition-all">
                    <Plus className="h-6 w-6" />
                    라운지 첫 글 작성하기
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
