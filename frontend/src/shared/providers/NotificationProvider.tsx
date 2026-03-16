'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { useAuthStore } from '@/features/auth/store/authStore';
import { notificationsService, Notification } from '@/shared/api/notificationsService';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, TrendingUp, Newspaper, MessageSquare, BrainCircuit } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useWebSocket();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [accessToken]);

  useEffect(() => {
    if (_hasHydrated && accessToken) {
      fetchNotifications();
    }
  }, [accessToken, _hasHydrated, fetchNotifications]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    // Join user's private notification room
    socket.emit('user:subscribe', user.id);

    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setActiveToast(notification);
      
      // Auto hide toast after 5 seconds
      setTimeout(() => {
        setActiveToast(current => current?.id === notification.id ? null : current);
      }, 5000);

      // Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, user?.id]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PRICE_ALARM': return <TrendingUp className="h-5 w-5 text-toss-blue" />;
      case 'NEWS_KEYWORD': return <Newspaper className="h-5 w-5 text-toss-green" />;
      case 'COMMUNITY_REPLY': return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case 'AI_REPORT': return <BrainCircuit className="h-5 w-5 text-purple-500" />;
      default: return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }}>
      {children}
      
      {/* Real-time Notification Toast */}
      <div className="fixed top-6 right-6 z-[9999] pointer-events-none w-full max-w-sm">
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="pointer-events-auto bg-white dark:bg-gray-800 rounded-2xl shadow-toss-large border border-gray-100 dark:border-gray-700 overflow-hidden flex cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              onClick={() => {
                if (activeToast.metadata?.postId) {
                  router.push(`/community/posts/${activeToast.metadata.postId}`);
                } else if (activeToast.metadata?.sessionId) {
                  router.push(`/chat?sessionId=${activeToast.metadata.sessionId}`);
                } else if (activeToast.stockCode) {
                  router.push(`/stocks/${activeToast.stockCode}`);
                } else if (activeToast.type === 'NEWS_KEYWORD') {
                  router.push('/news');
                }
                setActiveToast(null);
              }}
            >
              <div className="p-4 flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-xl bg-toss-bg dark:bg-gray-700">
                  {getNotificationIcon(activeToast.type)}
                </div>
                <div className="flex-1 pr-4">
                  <h4 className="text-[15px] font-bold text-toss-text-primary">{activeToast.title}</h4>
                  <p className="text-[13px] text-toss-text-secondary mt-0.5 line-clamp-2 leading-snug">
                    {activeToast.message}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToast(null);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-toss-text-placeholder" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
