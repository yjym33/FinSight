'use client';

import { useState, useRef, useEffect } from 'react';
import { useStockComments } from '../hooks/useStockComments';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Send, User, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface StockCommunityProps {
  stockCode: string; // 종목 코드
}

/**
 * 종목별 실시간 익명 커뮤니티 컴포넌트
 * 역할: 특정 종목의 상세 페이지 하단에 렌더링되며, 해당 종목에 대한 사용자들의 댓글을 보여주고 작성할 수 있게 합니다.
 * WebSocket을 통해 실시간으로 작성된 댓글을 브로드캐스팅 받아 렌더링합니다.
 */
export function StockCommunity({ stockCode }: StockCommunityProps) {
  const [commentInput, setCommentInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { comments, isLoading, postComment, isPosting } = useStockComments(stockCode);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isPosting) return;

    postComment(commentInput);
    setCommentInput('');
  };

  return (
    <Card className="flex h-full flex-col bg-white overflow-hidden shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-toss-blue" />
          <h3 className="text-lg font-bold text-toss-text-primary">실시간 커뮤니티</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-toss-blue">
          기분 좋은 대화를 나눠요
        </span>
      </div>

      {/* Comment List */}
      <div 
        className="relative flex-1 overflow-y-auto px-6 py-4 space-y-4"
        ref={scrollRef}
      >
        {isLoading && comments.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-toss-text-secondary">로딩 중...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 py-10">
            <div className="rounded-full bg-gray-50 p-4">
              <MessageCircle className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm text-toss-text-placeholder">첫 번째로 의견을 남겨보세요!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className="group flex flex-col items-start gap-1"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
                    <User className="h-3.5 w-3.5 text-toss-blue" />
                  </div>
                  <span className="text-sm font-semibold text-toss-text-secondary">
                    {comment.nickname}
                  </span>
                  <span className="text-[11px] text-toss-text-placeholder">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                  </span>
                </div>
                <div className="max-w-[85%] rounded-[20px] bg-gray-50 px-4 py-2 text-[15px] leading-relaxed text-toss-text-primary group-hover:bg-gray-100 transition-colors">
                  {comment.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer / Input */}
      <div className="border-t px-4 py-4 bg-gray-50/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="자유롭게 의견을 나눠보세요"
              className={`pr-10 bg-white transition-all shadow-sm ${isFocused ? 'ring-2 ring-toss-blue/20' : ''}`}
            />
            {commentInput && (
               <button 
                  type="submit"
                  disabled={isPosting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-toss-blue hover:bg-blue-50 transition-colors disabled:opacity-50"
               >
                 <Send className="h-4 w-4" />
               </button>
            )}
          </div>
        </form>
        <p className="mt-2 text-center text-[10px] text-toss-text-placeholder">
          타인의 권리를 침해하거나 욕설 등을 게시하면 운영정책에 따라 조치될 수 있습니다.
        </p>
      </div>
    </Card>
  );
}
