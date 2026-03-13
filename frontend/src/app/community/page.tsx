'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityService, CommunityPost } from '@/features/community/services/communityService';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
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
  Edit3
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SearchResultList } from '@/features/stocks/components/SearchResultList';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';

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
      alert('게시글이 성공적으로 등록되었습니다.');
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
    <div className="flex min-h-screen bg-toss-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="mx-auto w-full max-w-[1000px] p-8 pb-20">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-[32px] font-bold text-toss-text-primary tracking-tight">커뮤니티</h1>
              <p className="mt-2 text-toss-text-secondary text-[16px]">투자자들과 생각을 나눠보세요.</p>
            </div>
            <Button 
                onClick={() => setIsWriteOpen(true)}
                className="rounded-2xl px-6 py-6 h-auto bg-toss-blue hover:bg-toss-blue-hover text-white font-bold gap-2 shadow-lg shadow-toss-blue/20"
            >
              <Plus className="h-5 w-5" />
              글쓰기
            </Button>
          </header>

          {/* Search & Filter Bar */}
          <div className="flex gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-toss-text-placeholder" />
              <input 
                type="text" 
                placeholder="관심 있는 글을 검색해 보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-12 text-[16px] outline-none focus:ring-2 focus:ring-toss-blue/20 shadow-sm transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4 text-toss-text-placeholder" />
                </button>
              )}
            </div>
            <Button variant="outline" className="rounded-2xl px-5 border-gray-100 bg-white gap-2 text-toss-text-secondary">
              <Filter className="h-4 w-4" />
              필터
            </Button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-[24px] animate-pulse shadow-sm" />
              ))
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                <p className="text-red-500 mb-4 font-bold">오류가 발생했습니다.</p>
                <Button onClick={() => refetch()} variant="outline" className="rounded-2xl">다시 시도</Button>
              </div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((post: any) => (
                <motion.div
                  key={post.id}
                  layoutId={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => router.push(`/community/posts/${post.id}`)}
                >
                  <Card className="p-6 cursor-pointer hover:shadow-toss-hover transition-all duration-300 border-none group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-2">
                        {post.stockCode && (
                            <span className="inline-flex px-3 py-1 bg-toss-blue/10 text-toss-blue text-[12px] font-bold rounded-full w-fit">
                                {post.stockCode}
                            </span>
                        )}
                        <h3 className="text-[20px] font-bold text-toss-text-primary group-hover:text-toss-blue transition-colors">
                            {post.title}
                        </h3>
                        </div>
                        <ChevronRight className="h-6 w-6 text-toss-text-placeholder mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <p className="text-toss-text-secondary text-[15px] line-clamp-2 mb-6 leading-relaxed">
                        {post.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-toss-bg flex items-center justify-center text-[12px] font-bold text-toss-text-secondary">
                                {post.author?.nickname?.[0] || 'U'}
                            </div>
                            <span className="text-[14px] font-bold text-toss-text-primary">{post.author?.nickname || '익명'}</span>
                            <span className="text-[13px] text-toss-text-placeholder">· {new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-toss-text-placeholder">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-[13px] font-medium">{post.commentCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-toss-text-placeholder">
                                <ThumbsUp className="h-4 w-4" />
                                <span className="text-[13px] font-medium">{post.likeCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-toss-text-placeholder">
                                <Eye className="h-4 w-4" />
                                <span className="text-[13px] font-medium">{post.viewCount || 0}</span>
                            </div>
                        </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-dashed border-gray-200">
                <div className="h-20 w-20 bg-toss-bg rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="h-10 w-10 text-toss-text-placeholder opacity-20" />
                </div>
                <p className="text-[18px] font-bold text-toss-text-secondary mb-2">아직 등록된 게시글이 없습니다.</p>
                <p className="text-toss-text-placeholder mb-8">첫 글을 작성하여 투자자들과 생각을 나눠보세요!</p>
                <Button onClick={() => setIsWriteOpen(true)} className="rounded-2xl px-8 flex gap-2">
                    <Edit3 className="h-4 w-4" />
                    첫 글 쓰기
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Write Modal */}
      <AnimatePresence>
        {isWriteOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[600px] bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[24px] font-bold text-toss-text-primary">글쓰기</h2>
                <button onClick={() => setIsWriteOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-6 w-6 text-toss-text-placeholder" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-6">
                <div>
                  <p className="text-[14px] text-toss-text-secondary font-bold mb-3">연관 종목 (선택)</p>
                  <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-toss-text-placeholder" />
                        <Input 
                            placeholder="종목명 또는 코드 검색" 
                            value={stockSearchQuery || newPost.stockCode}
                            onChange={(e) => {
                                setStockSearchQuery(e.target.value);
                                setIsStockSearchOpen(true);
                                if (!e.target.value) {
                                    setNewPost(prev => ({ ...prev, stockCode: '' }));
                                }
                            }}
                            onFocus={() => setIsStockSearchOpen(true)}
                            className="rounded-2xl border-gray-100 focus:ring-toss-blue/20 pl-11"
                        />
                        {newPost.stockCode && !stockSearchQuery && (
                            <button 
                                type="button"
                                onClick={() => setNewPost(prev => ({ ...prev, stockCode: '' }))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-toss-blue font-bold text-[13px]"
                            >
                                {newPost.stockCode} <X className="inline h-3 w-3" />
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {isStockSearchOpen && stockSearchQuery && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-toss-large border border-gray-100 overflow-hidden z-[110] max-h-[300px] overflow-y-auto"
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
                <div>
                  <p className="text-[14px] text-toss-text-secondary font-bold mb-3">제목</p>
                  <Input 
                    placeholder="제목을 입력하세요" 
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    className="rounded-2xl border-gray-100 focus:ring-toss-blue/20 py-4"
                  />
                </div>
                <div>
                  <p className="text-[14px] text-toss-text-secondary font-bold mb-3">내용</p>
                  <textarea 
                    placeholder="생각을 자유롭게 적어보세요"
                    required
                    rows={8}
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className="w-full bg-toss-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-toss-blue/20 transition-all outline-none resize-none text-[16px]"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setIsWriteOpen(false)}
                    className="flex-1 rounded-2xl py-6 font-bold text-toss-text-secondary"
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createPostMutation.isPending}
                    className="flex-1 rounded-2xl py-6 font-bold bg-toss-blue text-white"
                  >
                    {createPostMutation.isPending ? '등록 중...' : '등록하기'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
