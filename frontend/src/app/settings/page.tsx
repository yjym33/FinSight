'use client';

import { Sidebar } from '@/shared/components/layout/Sidebar';
import { 
  Sparkles, 
  Bell, 
  Monitor, 
  User, 
  ShieldCheck, 
  ChevronRight,
  Target,
  Zap,
  BrainCircuit,
  Palette,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, UserSetting } from '@/features/settings/services/settingsService';
import { usersService } from '@/features/users/services/usersService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Lock } from 'lucide-react';

export default function SettingsPage() {
  const [activeSegment, setActiveSegment] = useState('general');
  const queryClient = useQueryClient();
  const [showToast, setShowToast] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  const mutation = useMutation({
    mutationFn: (updateData: Partial<UserSetting>) => settingsService.updateSettings(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    },
  });

  const defaultSettings: UserSetting = {
    id: '',
    aiAnalysisStyle: 'expert',
    autoReportEnabled: true,
    theme: 'light',
    chartColorStyle: 'kr',
    alertThreshold: 3.0,
    communityAlertEnabled: true,
    aiAlertEnabled: false,
    userId: '',
  };

  const currentSettings = settings || defaultSettings;

  const segments = [
    { id: 'general', label: '일반', icon: User },
    { id: 'ai', label: 'AI 인사이트', icon: BrainCircuit },
    { id: 'display', label: '화면 및 차트', icon: Palette },
    { id: 'alert', label: '알림', icon: Bell },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-toss-bg">
        <Loader2 className="h-8 w-8 text-toss-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-toss-bg">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto max-w-[1000px] px-10 py-16">
          <header className="mb-12">
            <h1 className="text-[32px] font-bold text-toss-text-primary tracking-tight">설정</h1>
            <p className="mt-2 text-toss-text-secondary text-[16px]">나에게 맞는 투자 환경을 설정해보세요.</p>
          </header>

          <div className="flex gap-12">
            <aside className="w-64 shrink-0">
              <nav className="flex flex-col gap-1">
                {segments.map((segment) => (
                  <button
                    key={segment.id}
                    onClick={() => setActiveSegment(segment.id)}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 rounded-2xl text-[16px] font-bold transition-all duration-200",
                      activeSegment === segment.id
                        ? "bg-white text-toss-blue shadow-sm"
                        : "text-toss-text-secondary hover:bg-gray-100/50"
                    )}
                  >
                    <segment.icon className={cn("h-5 w-5", activeSegment === segment.id ? "text-toss-blue" : "text-toss-text-placeholder")} />
                    {segment.label}
                  </button>
                ))}
              </nav>
            </aside>

            <section className="flex-1">
              <div className="space-y-6">
                {activeSegment === 'general' && <GeneralSettings />}
                {activeSegment === 'ai' && <AISettings settings={currentSettings} onUpdate={(d) => mutation.mutate(d)} />}
                {activeSegment === 'display' && <DisplaySettings settings={currentSettings} onUpdate={(d) => mutation.mutate(d)} />}
                {activeSegment === 'alert' && <AlertSettings settings={currentSettings} onUpdate={(d) => mutation.mutate(d)} />}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 min-w-[200px]"
          >
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="font-bold text-[15px]">설정이 저장되었습니다.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GeneralSettings() {
  const { user } = useAuthStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await usersService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        setIsChangingPassword(false);
        setSuccess(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] p-8 shadow-toss border border-gray-100"
      >
        <h2 className="text-[20px] font-bold text-toss-text-primary mb-8">기본 정보</h2>
        
        <div className="space-y-8">
          <div className="flex items-center justify-between group">
            <div>
              <p className="text-[14px] text-toss-text-secondary font-medium mb-1">사용자 이름 (닉네임)</p>
              <p className="text-[17px] text-toss-text-primary font-bold">{user?.nickname || '닉네임 없음'}</p>
            </div>
          </div>

          <div className="h-[1px] bg-gray-50" />

          <div className="flex items-center justify-between group">
            <div>
              <p className="text-[14px] text-toss-text-secondary font-medium mb-1">이메일 계정</p>
              <p className="text-[17px] text-toss-text-primary font-bold">{user?.email || '이메일 없음'}</p>
            </div>
          </div>

          <div className="h-[1px] bg-gray-50" />

          <div className="flex items-center justify-between group">
            <div>
              <p className="text-[14px] text-toss-text-secondary font-medium mb-1">비밀번호</p>
              <p className="text-[17px] text-toss-text-primary font-bold">••••••••</p>
            </div>
            <button 
              onClick={() => setIsChangingPassword(true)}
              className="text-[14px] font-bold text-toss-blue bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
            >
              변경
            </button>
          </div>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {isChangingPassword && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoading && setIsChangingPassword(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              {success ? (
                <div className="py-12 text-center">
                  <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-8 w-8 text-toss-blue" />
                  </div>
                  <h3 className="text-[20px] font-bold text-toss-text-primary mb-2">비밀번호가 변경되었습니다</h3>
                  <p className="text-toss-text-secondary">새로운 비밀번호로 안전하게 이용하세요.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-[22px] font-bold text-toss-text-primary">비밀번호 변경</h3>
                    <button 
                      onClick={() => !isLoading && setIsChangingPassword(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6 text-toss-text-placeholder" />
                    </button>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <p className="text-[14px] text-toss-text-secondary font-medium mb-2 pl-1">현재 비밀번호</p>
                      <input 
                        type="password"
                        required
                        value={passwordForm.oldPassword}
                        onChange={e => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                        className="w-full bg-toss-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-toss-blue transition-all outline-none"
                        placeholder="기존 비밀번호를 입력하세요"
                      />
                    </div>

                    <div className="space-y-4 pt-2">
                       <div>
                        <p className="text-[14px] text-toss-text-secondary font-medium mb-2 pl-1">새 비밀번호</p>
                        <input 
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full bg-toss-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-toss-blue transition-all outline-none"
                          placeholder="새로운 비밀번호 (6자 이상)"
                        />
                      </div>
                      <div>
                        <p className="text-[14px] text-toss-text-secondary font-medium mb-2 pl-1">새 비밀번호 확인</p>
                        <input 
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full bg-toss-bg border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-toss-blue transition-all outline-none"
                          placeholder="새 비밀번호를 한 번 더 입력하세요"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-[13px] text-toss-red font-medium pl-1 text-center">{error}</p>
                    )}

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-toss-blue text-white rounded-2xl py-5 font-bold text-[17px] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        '변경하기'
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

interface SettingComponentProps {
  settings: UserSetting;
  onUpdate: (data: Partial<UserSetting>) => void;
}

function AISettings({ settings, onUpdate }: SettingComponentProps) {
  const styles = [
    { id: 'summary', title: '핵심 요약형', desc: '군더더기 없이 사실 중심의 결과를 1문장으로 요약합니다.', icon: Target },
    { id: 'expert', title: '전문 투자자형', desc: '전문 용어를 포함하여 거시 경제와 연결된 심도 깊은 분석을 제공합니다.', icon: BrainCircuit },
    { id: 'friendly', title: '친절한 조언자형', desc: '초보 투자자도 이해하기 쉬운 비유와 따뜻한 말투로 설명합니다.', icon: Sparkles },
  ] as const;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-[24px] p-8 shadow-toss border border-gray-100">
        <h2 className="text-[20px] font-bold text-toss-text-primary mb-2">분석 스타일</h2>
        <p className="text-toss-text-secondary text-[14px] mb-8">AI가 뉴스와 시세를 분석할 때의 스타일을 선택하세요.</p>
        
        <div className="space-y-4">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => onUpdate({ aiAnalysisStyle: style.id })}
              className={cn(
                "w-full flex items-start gap-5 p-6 rounded-2xl border transition-all text-left",
                settings.aiAnalysisStyle === style.id
                  ? "border-toss-blue bg-blue-50/30"
                  : "border-gray-100 hover:border-gray-200"
              )}
            >
              <div className={cn(
                "mt-1 p-2.5 rounded-xl",
                settings.aiAnalysisStyle === style.id ? "bg-toss-blue text-white" : "bg-gray-100 text-toss-text-placeholder"
              )}>
                <style.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={cn("text-[17px] font-bold mb-1", settings.aiAnalysisStyle === style.id ? "text-toss-blue" : "text-toss-text-primary")}>
                  {style.title}
                </p>
                <p className="text-[14px] text-toss-text-secondary leading-relaxed">
                  {style.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-8 shadow-toss border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-toss-text-primary mb-1">변동 분석 리포트 자동 생성</h2>
            <p className="text-toss-text-secondary text-[14px]">보유 종목에 큰 변동이 생기면 AI가 자동으로 원인을 분석해 리포트를 작성합니다.</p>
          </div>
          <div className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.autoReportEnabled}
              onChange={(e) => onUpdate({ autoReportEnabled: e.target.checked })}
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-toss-blue" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DisplaySettings({ settings, onUpdate }: SettingComponentProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-[24px] p-8 shadow-toss border border-gray-100">
        <h2 className="text-[20px] font-bold text-toss-text-primary mb-8">기본 테마</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => onUpdate({ theme: 'light' })}
            className={cn(
              "flex-1 p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all",
              settings.theme === 'light' ? "border-toss-blue bg-blue-50/30" : "border-gray-100"
            )}
          >
            <div className="w-16 h-12 bg-gray-50 rounded-lg border border-gray-100 mb-1" />
            <span className={cn("font-bold text-[15px]", settings.theme === 'light' ? "text-toss-blue" : "text-toss-text-primary")}>라이트 모드</span>
          </button>
          <button 
            onClick={() => onUpdate({ theme: 'dark' })}
            className={cn(
              "flex-1 p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all",
              settings.theme === 'dark' ? "border-toss-blue bg-blue-50/30" : "border-gray-100"
            )}
          >
            <div className="w-16 h-12 bg-gray-800 rounded-lg border border-gray-700 mb-1" />
            <span className={cn("font-bold text-[15px]", settings.theme === 'dark' ? "text-toss-blue" : "text-toss-text-primary")}>다크 모드</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-8 shadow-toss border border-gray-100">
        <h2 className="text-[20px] font-bold text-toss-text-primary mb-6">차트 색상 스타일</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => onUpdate({ chartColorStyle: 'kr' })}
            className={cn(
              "flex-1 p-5 rounded-2xl border transition-all text-left",
              settings.chartColorStyle === 'kr' ? "border-toss-blue bg-blue-50/30" : "border-gray-100"
            )}
          >
            <p className="text-[15px] font-bold text-toss-text-primary mb-3">한국식 (상승: 빨강, 하락: 파랑)</p>
            <div className="flex gap-1.5">
              <div className="h-6 w-3 bg-red-500 rounded-sm" />
              <div className="h-4 w-3 bg-blue-500 rounded-sm self-end" />
            </div>
          </button>
          <button 
            onClick={() => onUpdate({ chartColorStyle: 'us' })}
            className={cn(
              "flex-1 p-5 rounded-2xl border transition-all text-left",
              settings.chartColorStyle === 'us' ? "border-toss-blue bg-blue-50/30" : "border-gray-100"
            )}
          >
            <p className="text-[15px] font-bold text-toss-text-primary mb-3">미국식 (상승: 초록, 하락: 빨강)</p>
            <div className="flex gap-1.5">
              <div className="h-6 w-3 bg-green-500 rounded-sm" />
              <div className="h-4 w-3 bg-red-500 rounded-sm self-end" />
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AlertSettings({ settings, onUpdate }: SettingComponentProps) {
  const [localThreshold, setLocalThreshold] = useState(settings.alertThreshold);

  useEffect(() => {
    setLocalThreshold(settings.alertThreshold);
  }, [settings.alertThreshold]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-[24px] p-8 shadow-toss border border-gray-100">
        <h2 className="text-[20px] font-bold text-toss-text-primary mb-2">실시간 주가 알림</h2>
        <p className="text-toss-text-secondary text-[14px] mb-10">변동폭이 설정한 기준을 넘으면 브라우저로 실시간 알림을 보냅니다.</p>
        
        <div className="px-4">
          <div className="flex justify-between mb-4">
            <span className="text-[15px] font-bold text-toss-blue">민감도 설정</span>
            <span className="text-[17px] font-bold text-toss-text-primary">{localThreshold}%</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="0.5"
            value={localThreshold} 
            onChange={(e) => setLocalThreshold(parseFloat(e.target.value))}
            onMouseUp={() => onUpdate({ alertThreshold: localThreshold })}
            onTouchEnd={() => onUpdate({ alertThreshold: localThreshold })}
            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-toss-blue"
          />
          <div className="flex justify-between mt-3 text-[12px] text-toss-text-placeholder font-medium">
            <span>민감함 (1%)</span>
            <span>보통 (3~5%)</span>
            <span>둔감함 (10%)</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-8 shadow-toss border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-[18px] font-bold text-toss-text-primary mb-1">커뮤니티 활동 알림</h2>
            <p className="text-toss-text-secondary text-[14px]">내가 쓴 글에 댓글이나 공감이 달리면 알려줍니다.</p>
          </div>
          <div className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.communityAlertEnabled}
              onChange={(e) => onUpdate({ communityAlertEnabled: e.target.checked })}
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-toss-blue" />
          </div>
        </div>

        <div className="h-[1px] bg-gray-50 mb-8" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-toss-text-primary mb-1">AI 분석 완료 알림</h2>
            <p className="text-toss-text-secondary text-[14px]">요청한 종목의 AI 심층 분석이 완료되면 알려줍니다.</p>
          </div>
          <div className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.aiAlertEnabled}
              onChange={(e) => onUpdate({ aiAlertEnabled: e.target.checked })}
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-toss-blue" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
