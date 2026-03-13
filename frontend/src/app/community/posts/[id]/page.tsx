'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { communityService } from '@/features/community/services/communityService';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  MessageSquare, 
  ThumbsUp, 
  Reply,
  Send,
  MoreVertical,
  Flag
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function PostDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: post, isLoading } = useQuery({
    queryKey: ['community', 'post', id],
    queryFn: () => communityService.getPost(id),
  });

  const createCommentMutation = useMutation({
    mutationFn: communityService.createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'post', id] });
      setCommentContent('');
      setReplyTo(null);
      setReplyContent('');
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    createCommentMutation.mutate({ content: commentContent, postId: id });
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    createCommentMutation.mutate({ content: replyContent, postId: id, parentId });
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-toss-bg"><div className="animate-spin h-10 w-10 border-4 border-toss-blue border-t-transparent rounded-full" /></div>;
  if (!post) return <div className="flex h-screen items-center justify-center bg-toss-bg">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="flex min-h-screen bg-toss-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="mx-auto w-full max-w-[800px] p-8 pb-20">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-toss-text-secondary hover:text-toss-text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-bold">목록으로 돌아가기</span>
          </button>

          <Card className="p-8 mb-6 border-none shadow-sm">
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {post.stockCode && (
                  <span className="px-3 py-1 bg-toss-blue/10 text-toss-blue text-[12px] font-bold rounded-full">
                    {post.stockCode}
                  </span>
                )}
                <span className="text-[14px] text-toss-text-placeholder">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
              <h1 className="text-[28px] font-bold text-toss-text-primary mb-6 leading-tight">{post.title}</h1>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-toss-bg flex items-center justify-center text-[14px] font-bold text-toss-text-secondary">
                  {post.author.nickname[0]}
                </div>
                <div>
                  <p className="text-[16px] font-bold text-toss-text-primary">{post.author.nickname}</p>
                  <p className="text-[13px] text-toss-text-secondary">작성자</p>
                </div>
              </div>
            </header>

            <div className="text-[17px] text-toss-text-primary leading-[1.8] whitespace-pre-wrap mb-10">
              {post.content}
            </div>

            <div className="flex items-center gap-6 pt-8 border-t border-gray-50">
                <button className="flex items-center gap-2 text-toss-text-secondary hover:text-toss-blue transition-colors">
                    <ThumbsUp className="h-6 w-6" />
                    <span className="font-bold">{post.likeCount}</span>
                </button>
                <div className="flex items-center gap-2 text-toss-text-secondary">
                    <MessageSquare className="h-6 w-6" />
                    <span className="font-bold">{post.comments?.length || 0}</span>
                </div>
            </div>
          </Card>

          {/* Comment Input */}
          <div className="mb-10">
            <h2 className="text-[18px] font-bold text-toss-text-primary mb-4">댓글 {post.comments?.length || 0}</h2>
            <form onSubmit={handleSubmitComment} className="relative">
              <textarea 
                placeholder="댓글을 남겨보세요"
                rows={3}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-[20px] px-5 py-4 pr-16 focus:ring-2 focus:ring-toss-blue/20 transition-all outline-none shadow-sm resize-none text-[15px]"
              />
              <button 
                type="submit"
                disabled={!commentContent.trim() || createCommentMutation.isPending}
                className="absolute right-4 bottom-4 p-3 bg-toss-blue text-white rounded-xl disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-lg shadow-toss-blue/20"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Comment List */}
          <div className="space-y-4">
            {post.comments?.filter((c: any) => !c.parentId).map((comment: any) => (
              <div key={comment.id} className="space-y-4">
                <Card className="p-6 border-none shadow-sm">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-toss-bg flex items-center justify-center text-[12px] font-bold text-toss-text-secondary">
                        {comment.author.nickname[0]}
                      </div>
                      <div>
                        <span className="text-[15px] font-bold text-toss-text-primary">{comment.author.nickname}</span>
                        <span className="text-[12px] text-toss-text-placeholder ml-2">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button className="text-gray-300 hover:text-gray-400">
                        <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-[16px] text-toss-text-primary leading-relaxed mb-4">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-1.5 text-[13px] font-bold text-toss-text-secondary hover:text-toss-blue transition-colors"
                    >
                      <Reply className="h-4 w-4" />
                      답글 달기
                    </button>
                    <button className="flex items-center gap-1.5 text-[13px] font-bold text-toss-text-secondary hover:text-red-500 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      도움돼요 {comment.likeCount}
                    </button>
                  </div>

                  {/* Reply Input */}
                  <AnimatePresence>
                    {replyTo === comment.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-6 border-t border-gray-50"
                      >
                        <div className="flex gap-3">
                            <textarea 
                                autoFocus
                                placeholder="답글을 남겨보세요"
                                rows={2}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="flex-1 bg-toss-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-toss-blue/20 transition-all outline-none resize-none text-[15px]"
                            />
                            <button 
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim()}
                                className="px-6 bg-toss-blue text-white rounded-2xl font-bold disabled:bg-gray-100 disabled:text-gray-400 transition-all"
                            >
                                등록
                            </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* Replies */}
                <div className="pl-12 space-y-4">
                  {comment.replies?.map((reply: any) => (
                    <Card key={reply.id} className="p-5 border-none shadow-sm bg-gray-50/50">
                       <div className="flex items-center gap-3 mb-3">
                        <div className="h-7 w-7 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold text-toss-text-secondary">
                          {reply.author.nickname[0]}
                        </div>
                        <div>
                          <span className="text-[14px] font-bold text-toss-text-primary">{reply.author.nickname}</span>
                          <span className="text-[11px] text-toss-text-placeholder ml-2">{new Date(reply.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-[15px] text-toss-text-primary leading-relaxed">
                        {reply.content}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
