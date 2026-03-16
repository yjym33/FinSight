'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authService } from '@/features/auth/services/authService';
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, accessToken, _hasHydrated } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (_hasHydrated && accessToken) {
      router.push('/dashboard');
    }
  }, [accessToken, _hasHydrated, router]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data: any) => {
      setAuth(data.accessToken, data.user);
      router.push('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data: any) => {
      setAuth(data.accessToken, data.user);
      router.push('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      registerMutation.mutate(formData);
    } else {
      loginMutation.mutate({ email: formData.email, password: formData.password });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-toss-blue/5 rounded-full blur-[120px]" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[500px] px-6"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl shadow-toss-blue/20 flex items-center justify-center mb-6 transform rotate-3">
             <ShieldCheck className="h-10 w-10 text-toss-blue" />
          </div>
          <motion.div 
            key={isRegister ? 'reg-header' : 'login-header'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {isRegister ? '성공 투자의 시작' : '다시 돌아오셨네요!'}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              {isRegister 
                ? '단 몇 초 만에 투자의 품격을 높여보세요.' 
                : '오늘의 시장 흐름을 AI와 함께 분석해 보세요.'}
            </p>
          </motion.div>
        </div>

        <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 backdrop-blur-md overflow-hidden p-2">
          <CardContent className="p-8 pt-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-3">
                   <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">이메일 계정</Label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-toss-blue transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-toss-blue/30 font-bold"
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">비밀번호</Label>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-toss-blue transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-toss-blue/30 font-bold"
                      />
                   </div>
                </div>

                <AnimatePresence mode="wait">
                  {isRegister && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                       <Label htmlFor="nickname" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">닉네임</Label>
                       <div className="relative group">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-toss-blue transition-colors" />
                          <Input
                            id="nickname"
                            type="text"
                            name="nickname"
                            placeholder="개미대장"
                            value={formData.nickname}
                            onChange={handleChange}
                            required
                            className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-toss-blue/30 font-bold"
                          />
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {(loginMutation.error || registerMutation.error) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                  {isRegister ? '이미 사용 중인 정보인지 확인해보세요.' : '계정 정보가 일치하지 않습니다.'}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-16 rounded-2xl bg-toss-blue hover:bg-toss-blue/90 text-white font-black text-lg shadow-xl shadow-toss-blue/20 transition-all active:scale-95 disabled:opacity-50"
                disabled={loginMutation.isPending || registerMutation.isPending}
              >
                {loginMutation.isPending || registerMutation.isPending ? (
                  <div className="flex items-center gap-2">
                     <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     처리 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isRegister ? '지금 시작하기' : '로그인'}
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 p-8 pt-0 mt-4">
            <div className="relative w-full">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800" />
               </div>
               <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                  <span className="bg-white dark:bg-slate-900/80 px-4">or switch to</span>
               </div>
            </div>
            
            <p className="text-slate-500 font-bold text-base text-center">
              {isRegister ? '이미 계정이 있으신가요?' : '아직 회원이 아니신가요?'}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="ml-3 text-toss-blue hover:text-blue-600 transition-colors underline-offset-4 hover:underline"
              >
                {isRegister ? '로그인하기' : '무료로 시작하기'}
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
