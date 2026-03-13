'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';

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
    <main className="flex min-h-screen items-center justify-center bg-toss-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[450px]"
      >
        <Card className="shadow-2xl">
          <div className="mb-10 flex flex-col items-center">
            <motion.div 
              key={isRegister ? 'reg' : 'login'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <h1 className="text-[32px] font-bold tracking-tight text-toss-text-primary">
                {isRegister ? '처음이신가요?' : '반가워요!'}
              </h1>
              <p className="mt-2 text-[17px] text-toss-text-secondary">
                {isRegister 
                  ? '정보를 입력하고 투자를 시작해보세요' 
                  : '투자자님의 자산과 소식을 확인해보세요'}
              </p>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="email"
                name="email"
                placeholder="이메일 주소"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <AnimatePresence>
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Input
                      type="text"
                      name="nickname"
                      placeholder="닉네임"
                      value={formData.nickname}
                      onChange={handleChange}
                      required
                      className="mt-3"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(loginMutation.error || registerMutation.error) && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="px-1 text-[13px] font-medium text-red-500"
              >
                {isRegister
                  ? '가입 정보를 다시 확인해주세요.'
                  : '이메일이나 비밀번호가 맞지 않아요.'}
              </motion.p>
            )}

            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {loginMutation.isPending || registerMutation.isPending
                ? '잠시만 기다려주세요...'
                : isRegister
                ? '가입하기'
                : '로그인'}
            </Button>
          </form>

          <footer className="mt-8 flex justify-center border-t border-gray-100 pt-8 text-center">
            <p className="text-[15px] text-toss-text-secondary">
              {isRegister ? '이미 계정이 있으신가요?' : '아직 회원이 아니신가요?'}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="ml-2 font-bold text-toss-blue hover:underline"
              >
                {isRegister ? '로그인하기' : '가입하기'}
              </button>
            </p>
          </footer>
        </Card>
      </motion.div>
    </main>
  );
}
