"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  Sparkles, 
  Search,
  MessageCircle,
  BrainCircuit,
  History
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { chatService, ChatSession } from '@/features/chat/services/chatService';
import { Header } from '@/shared/components/layout/Header';
import { Sidebar } from '@/shared/components/layout/Sidebar';

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { ChatWindow } from '@/features/chat/components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, _hasHydrated } = useAuthStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);

  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.push('/login');
    }
  }, [accessToken, _hasHydrated, router]);

  useEffect(() => {
    if (urlSessionId) {
      setSelectedSessionId(urlSessionId);
    }
  }, [urlSessionId]);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: chatService.getSessions,
    enabled: !!accessToken,
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['chatRecommendations'],
    queryFn: chatService.getRecommendations,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const createSessionMutation = useMutation({
    mutationFn: chatService.createSession,
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setSelectedSessionId(newSession.id);
    },
  });

  const handleRecommendationClick = (text: string) => {
    setInitialMessage(text);
    createSessionMutation.mutate();
  };

  const deleteSessionMutation = useMutation({
    mutationFn: chatService.deleteSession,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      // Clear associated messages from cache
      queryClient.removeQueries({ queryKey: ['chatMessages', deletedId] });
      
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

  // Sync selectedSessionId with sessions list
  useEffect(() => {
    if (sessions) {
      if (sessions.length > 0) {
        if (!selectedSessionId) {
          setSelectedSessionId(sessions[0].id);
        } else {
          const exists = sessions.some(s => s.id === selectedSessionId);
          if (!exists) {
            setSelectedSessionId(sessions[0].id);
          }
        }
      } else {
        setSelectedSessionId(null);
      }
    }
  }, [sessions, selectedSessionId]);

  if (!_hasHydrated || !accessToken) return null;

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 flex overflow-hidden p-6 lg:p-10 gap-8">
          {/* Sessions List Sidebar */}
          <div className="w-[360px] flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">AI 분석봇</h1>
                <p className="text-sm font-medium text-slate-500">지능형 투자 비서와 대화하세요</p>
              </div>
              <Button
                onClick={() => createSessionMutation.mutate()}
                disabled={createSessionMutation.isPending}
                size="icon"
                className="h-12 w-12 rounded-2xl bg-toss-blue hover:bg-toss-blue/90 text-white shadow-xl shadow-toss-blue/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>

            <Card className="flex-1 border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[32px] overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 px-1">
                   <History className="h-4 w-4 text-slate-400" />
                   <span className="text-xs font-black uppercase tracking-widest text-slate-400">최근 대화 내역</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-3 overflow-hidden">
                {sessionsLoading ? (
                  <div className="flex flex-col gap-4 p-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : (sessions?.length || 0) === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center py-20 text-center px-6">
                    <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                       <MessageCircle className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2">대화 내역이 없습니다</h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                      아직 AI 비서와 대화한 내용이 없네요.<br/>새로운 대화를 시작해보세요.
                    </p>
                    <Button 
                      onClick={() => createSessionMutation.mutate()}
                      variant="outline"
                      className="rounded-xl font-bold border-slate-200"
                    >
                      첫 대화 시작하기
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-320px)]">
                    <div className="space-y-2 p-1">
                      {sessions?.map((session: ChatSession) => {
                        const isActive = selectedSessionId === session.id;
                        return (
                          <motion.div
                            key={session.id}
                            initial={false}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                               setSelectedSessionId(session.id);
                               setInitialMessage(undefined); // Clear initial message when switching manually
                             }}
                             className={cn(
                               'group relative w-full flex items-center rounded-2xl pl-3 pr-12 py-3.5 transition-all duration-300 text-left cursor-pointer border-2',
                               isActive 
                                 ? 'bg-slate-100 dark:bg-slate-800 text-toss-blue border-slate-200 dark:border-slate-700 shadow-sm' 
                                 : 'bg-transparent border-transparent text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                             )}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={cn(
                                "flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl font-black text-xs",
                                isActive ? "bg-toss-blue/10 text-toss-blue" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-toss-blue/10 group-hover:text-toss-blue"
                              )}>
                                {isActive ? 'AI' : '💬'}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className={cn("text-[14px] font-black truncate leading-tight", isActive ? "text-toss-blue" : "text-slate-900 dark:text-slate-100")}>
                                  {session.title || '투자 분석 대화'}
                                </p>
                                <p className={cn("flex items-center gap-1 mt-1 text-[10px] font-medium", isActive ? "text-toss-blue/60" : "text-slate-400")}>
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
                              "absolute right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100",
                              isActive && "opacity-100"
                            )}>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => handleEditTitle(e, session)}
                                className={cn("h-7 w-7 rounded-lg", isActive ? "hover:bg-toss-blue/10 text-toss-blue/50 hover:text-toss-blue" : "text-slate-400 hover:text-slate-900")}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => handleDelete(e, session.id)}
                                className={cn("h-7 w-7 rounded-lg", isActive ? "hover:bg-rose-100 dark:hover:bg-rose-900/20 text-toss-blue/50 hover:text-rose-500" : "text-slate-400 hover:text-rose-500")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <AnimatePresence mode="wait">
              {selectedSessionId ? (
                <motion.div
                  key={selectedSessionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                   className="h-full"
                 >
                   <ChatWindow 
                    sessionId={selectedSessionId} 
                    initialMessage={initialMessage} 
                   />
                 </motion.div>
              ) : (
                <Card className="flex h-full flex-col items-center justify-center border-none bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[48px] overflow-hidden p-12 text-center group">
                  <div className="relative mb-10">
                    <div className="absolute inset-0 bg-toss-blue/20 blur-[100px] rounded-full group-hover:blur-[120px] transition-all" />
                    <div className="relative h-32 w-32 bg-gradient-to-tr from-toss-blue to-blue-400 rounded-[40px] shadow-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                      <BrainCircuit className="h-16 w-16 text-white" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-4">투자 비서가 준비되었습니다</h2>
                  <p className="max-w-md mx-auto text-lg font-medium text-slate-500 leading-relaxed mb-10">
                    실시간 시장 데이터와 뉴스 분석을 통해<br />
                    당신의 현명한 투자 결정을 지원합니다.
                  </p>
                  <Badge variant="secondary" className="px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-black mb-12">
                     Beta v2.0 AI Engine
                  </Badge>
                   <div className="grid grid-cols-2 gap-4 w-full max-w-lg mx-auto">
                    {recommendationsLoading ? (
                      [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)
                    ) : (recommendations || ['삼성전자 전망 알려줘', '오늘 코스피 분위기', '반도체 섹터 호재', '저평가 종목 추천']).map((text) => (
                      <Button 
                        key={text}
                        variant="ghost" 
                        onClick={() => handleRecommendationClick(text)}
                        className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 font-bold transition-all text-slate-600 dark:text-slate-400 text-[15px]"
                      >
                        "{text}"
                      </Button>
                    ))}
                  </div>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
