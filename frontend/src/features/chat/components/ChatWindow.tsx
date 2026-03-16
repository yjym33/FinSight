import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, Bot, Zap, ArrowDown, User as UserIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService } from '@/features/chat/services/chatService';
import { ChatMessage } from './ChatMessage';

// Shadcn UI Components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ChatWindowProps {
  sessionId: string;
  initialMessage?: string;
}

export function ChatWindow({ sessionId, initialMessage }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const queryKey = ['chatMessages', sessionId];

  const { data: messages, isLoading } = useQuery({
    queryKey,
    queryFn: () => chatService.getMessages(sessionId),
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatService.sendMessage(sessionId, msg),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey });
      const previousMessages = queryClient.getQueryData(queryKey);

      const optimisticMessage = {
        id: 'optimistic-' + Date.now(),
        sender: 'user',
        message: newMsg,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, (old: any) => [...(old || []), optimisticMessage]);
      return { previousMessages };
    },
    onError: (err, newMsg, context: any) => {
      queryClient.setQueryData(queryKey, context.previousMessages);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, sendMutation.isPending]);
  
  // Auto-send initial message if chat is new
  useEffect(() => {
    if (initialMessage && messages && messages.length === 0 && !sendMutation.isPending) {
        sendMutation.mutate(initialMessage);
    }
  }, [initialMessage, messages, sendMutation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMutation.isPending) {
      const msgToSend = message;
      setMessage('');
      sendMutation.mutate(msgToSend);
    }
  };

  return (
    <Card className="flex h-full flex-col border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[40px] overflow-hidden">
      {/* Chat Header */}
      <div className="flex h-20 items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-toss-blue/10 text-toss-blue shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-toss-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Bot className="h-6 w-6 relative z-10" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">투자 분석 전문가</h3>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[11px] font-black text-green-600 dark:text-green-500 uppercase tracking-widest">Active Intelligence</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="rounded-xl border-slate-200 text-slate-400 font-bold px-3 py-1">GPT-4o Optimized</Badge>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden bg-slate-50/30 dark:bg-slate-950/30">
        <ScrollArea ref={scrollRef} className="h-full px-8 py-10">
          <div className="max-w-3xl mx-auto space-y-8">
            {isLoading ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 bg-toss-blue/10 rounded-2xl flex items-center justify-center animate-bounce">
                   <Zap className="h-6 w-6 text-toss-blue fill-toss-blue" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">이전 대화 분석 중...</p>
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center text-center px-10">
                <div className="mb-8 rounded-[32px] bg-white dark:bg-slate-800 p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                  <MessageCircle className="h-12 w-12 text-toss-blue" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3">투자의 지침이 되어 드릴게요</h3>
                <p className="max-w-xs mx-auto text-[15px] font-medium text-slate-500 leading-relaxed">
                  궁금한 증권사 레포트 내용이나,<br />
                  실시간 종목 호재를 물어보세요.
                </p>
              </div>
            ) : (
              <>
                {messages?.map((msg: any) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {sendMutation.isPending && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="flex items-start gap-4 mb-10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-toss-blue/10 text-toss-blue shadow-inner flex-shrink-0 animate-pulse">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] rounded-tl-none px-6 py-5 shadow-sm">
                      <div className="flex gap-2 items-center h-4">
                        {[0, 0.2, 0.4].map((delay) => (
                          <motion.div 
                            key={delay}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
                            transition={{ repeat: Infinity, duration: 1.2, delay }}
                            className="h-1.5 w-1.5 rounded-full bg-toss-blue" 
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input section */}
      <div className="bg-white/50 dark:bg-slate-900/50 p-8 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl relative group">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="전문가에게 투자의 인사이트를 물어보세요..."
            disabled={sendMutation.isPending}
            className="h-[72px] w-full rounded-[24px] border-none bg-slate-100 dark:bg-slate-800/50 px-8 pr-24 text-[16px] font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 focus-visible:ring-toss-blue/30 shadow-inner group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <Button 
               type="submit" 
               disabled={sendMutation.isPending || !message.trim()}
               size="icon"
               className="h-12 w-12 rounded-xl bg-toss-blue hover:bg-toss-blue/90 text-white shadow-xl shadow-toss-blue/20 transition-all active:scale-95 disabled:scale-100 disabled:opacity-20 translate-x-0"
             >
               <Send className="h-6 w-6" />
             </Button>
          </div>
        </form>
        <div className="flex items-center justify-center gap-2 mt-6">
           <Zap className="h-3 w-3 text-slate-300 fill-slate-300" />
           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
             Powered by Advacned Market Intelligence
           </p>
        </div>
      </div>
    </Card>
  );
}
