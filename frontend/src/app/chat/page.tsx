'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Clock, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { chatService, ChatSession } from '@/features/chat/services/chatService';
import { Header } from '@/shared/components/layout/Header';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Card } from '@/shared/components/ui/Card';
import { ChatWindow } from '@/features/chat/components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, _hasHydrated } = useAuthStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.push('/login');
    }
  }, [accessToken, _hasHydrated, router]);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: chatService.getSessions,
    enabled: !!accessToken,
  });

  const createSessionMutation = useMutation({
    mutationFn: chatService.createSession,
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setSelectedSessionId(newSession.id);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: chatService.deleteSession,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      if (selectedSessionId === deletedId) {
        setSelectedSessionId(null);
      }
    },
  });

  const updateTitleMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => 
      chatService.updateTitle(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('대화를 삭제하시겠습니까?')) {
      deleteSessionMutation.mutate(id);
    }
  };

  const handleEditTitle = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    const newTitle = prompt('새로운 대화 제목을 입력하세요', session.title);
    if (newTitle && newTitle.trim() !== session.title) {
      updateTitleMutation.mutate({ id: session.id, title: newTitle.trim() });
    }
  };

  useEffect(() => {
    if ((sessions?.length || 0) > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions![0].id);
    }
  }, [sessions, selectedSessionId]);

  if (!_hasHydrated || !accessToken) return null;

  return (
    <div className="flex h-screen bg-toss-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 flex overflow-hidden p-8 gap-8">
          {/* Sessions List Sidebar */}
          <div className="w-[320px] flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h1 className="text-[24px] font-bold text-toss-text-primary">투자봇 대화</h1>
              <button
                onClick={() => createSessionMutation.mutate()}
                disabled={createSessionMutation.isPending}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-toss-blue text-white shadow-lg shadow-toss-blue/20 transition-all hover:brightness-95 active:scale-95 disabled:opacity-50"
                title="새로운 대화 시작"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <Card className="flex-1 p-3 overflow-y-auto border-none bg-white shadow-sm">
              {sessionsLoading ? (
                <div className="flex flex-col gap-3 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-toss-bg" />
                  ))}
                </div>
              ) : (sessions?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageSquare className="h-10 w-10 text-toss-text-placeholder mb-4" />
                  <p className="text-[15px] font-bold text-toss-text-secondary">대화 내역이 없어요</p>
                  <button 
                    onClick={() => createSessionMutation.mutate()}
                    className="mt-4 text-[14px] font-bold text-toss-blue"
                  >
                    첫 대화 시작하기
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {sessions?.map((session: ChatSession) => {
                    const isActive = selectedSessionId === session.id;
                    return (
                      <motion.div
                        key={session.id}
                        initial={false}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={cn(
                          'group relative w-full flex items-center justify-between rounded-2xl px-5 py-5 transition-all duration-200 text-left cursor-pointer',
                          isActive 
                            ? 'bg-toss-bg text-toss-blue' 
                            : 'text-toss-text-secondary hover:bg-toss-bg/50 hover:text-toss-text-primary'
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={cn(
                            "flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full text-[18px]",
                            isActive ? "bg-white text-toss-blue shadow-sm" : "bg-toss-bg text-toss-text-secondary"
                          )}>
                            💬
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[16px] font-bold truncate", isActive ? "text-toss-text-primary" : "")}>
                              {session.title || '투자 분석 대화'}
                            </p>
                            <p className="flex items-center gap-1 mt-0.5 text-[12px] text-toss-text-placeholder">
                              <Clock className="h-3 w-3" />
                              {new Date(session.createdAt).toLocaleDateString('ko-KR', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className={cn(
                          "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-3 group-hover:translate-x-0",
                          isActive && "opacity-100"
                        )}>
                          <button 
                            onClick={(e) => handleEditTitle(e, session)}
                            className="p-1.5 hover:bg-white rounded-md text-toss-text-placeholder hover:text-toss-text-secondary"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, session.id)}
                            className="p-1.5 hover:bg-red-50 rounded-md text-toss-text-placeholder hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <AnimatePresence mode="wait">
              {selectedSessionId ? (
                <motion.div
                  key={selectedSessionId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ChatWindow sessionId={selectedSessionId} />
                </motion.div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-white p-10 shadow-toss mb-6">
                    <MessageSquare className="h-12 w-12 text-toss-blue" />
                  </div>
                  <h2 className="text-[22px] font-bold text-toss-text-primary">무엇이든 물어보세요</h2>
                  <p className="mt-2 text-[16px] text-toss-text-secondary leading-relaxed">
                    종목 분석부터 경제 지표까지<br />
                    투자봇이 실시간으로 답변해드립니다.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
