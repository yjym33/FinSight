'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService } from '@/features/chat/services/chatService';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/shared/components/ui/Button';

interface ChatWindowProps {
  sessionId: string; // 현재 활성화된 채팅 세션 ID
}

/**
 * 인공지능 투자 비서 대화창 컴포넌트
 * 역할: 선택된 세션(sessionId)의 이전 대화 내역을 불러오고, 새 메시지를 전송하여 AI와 대화하는 기능을 담당합니다.
 * React Query를 통해 메시지 상태를 관리하며 낙관적 업데이트(Optimistic Update)를 적용해 빠른 반응성을 제공합니다.
 */
export function ChatWindow({ sessionId }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const queryKey = ['chatMessages', sessionId];

  const { data: messages, isLoading } = useQuery({
    queryKey,
    queryFn: () => chatService.getMessages(sessionId),
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatService.sendMessage(sessionId, msg),
    onMutate: async (newMsg) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      const optimisticMessage = {
        id: 'optimistic-' + Date.now(),
        sender: 'user',
        message: newMsg,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, (old: any) => [...(old || []), optimisticMessage]);

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (err, newMsg, context: any) => {
      // Roll back to the previous value if error occurs
      queryClient.setQueryData(queryKey, context.previousMessages);
    },
    onSettled: () => {
      // Always refetch after error or success to sync with the server
      queryClient.invalidateQueries({ queryKey });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMutation.isPending) {
      const msgToSend = message;
      setMessage(''); // Clear input immediately
      sendMutation.mutate(msgToSend);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-toss-large overflow-hidden border border-gray-100 shadow-sm">
      {/* Chat Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-50 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-toss-blue/10 text-toss-blue">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-toss-text-primary">인공지능 투자 비서</h3>
            <p className="text-[12px] text-green-500 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> 실시간 분석 중
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-toss-bg/30 p-8">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-toss-blue border-t-transparent" />
            <p className="text-[14px] font-bold text-toss-text-secondary">메시지를 불러오고 있어요</p>
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-white p-6 shadow-sm">
              <MessageCircle className="h-10 w-10 text-toss-text-placeholder" />
            </div>
            <p className="text-[18px] font-bold text-toss-text-primary">반가워요!</p>
            <p className="mt-2 text-[15px] text-toss-text-secondary leading-relaxed">
              시장 분석이나 종목 추천 등<br />
              궁금한 내용을 물어보세요.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {messages?.map((msg: any) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {sendMutation.isPending && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex items-end gap-2 mb-6"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-toss-blue/10 text-[12px] font-bold text-toss-blue flex-shrink-0 animate-pulse">
                  AI
                </div>
                <div className="bg-white text-toss-text-primary rounded-toss-base rounded-tl-none border border-gray-100 px-5 py-4 shadow-sm">
                  <div className="flex gap-1.5 h-1.5 items-center">
                    {[0, 0.2, 0.4].map((delay) => (
                      <motion.div 
                        key={delay}
                        animate={{ opacity: [0.3, 1, 0.3] }} 
                        transition={{ repeat: Infinity, duration: 1.5, delay }}
                        className="h-1.5 w-1.5 rounded-full bg-toss-blue" 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input section */}
      <div className="bg-white p-6 border-t border-gray-50">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl relative">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="궁금한 내용을 입력하세요..."
            disabled={sendMutation.isPending}
            className="h-[60px] w-full items-center rounded-toss-base bg-toss-bg px-6 pr-20 text-[16px] text-toss-text-primary transition-all placeholder:text-toss-text-placeholder focus:bg-white focus:outline-none focus:ring-2 focus:ring-toss-blue/50"
          />
          <button 
            type="submit" 
            disabled={sendMutation.isPending || !message.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-xl bg-toss-blue text-white shadow-lg shadow-toss-blue/20 transition-all hover:brightness-95 active:scale-95 disabled:scale-100 disabled:opacity-30"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-4 text-center text-[12px] text-toss-text-placeholder">
          AI 비서의 응답은 참고용으로만 활용해주세요.
        </p>
      </div>
    </div>
  );
}
