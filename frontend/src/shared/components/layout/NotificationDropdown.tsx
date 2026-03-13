'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/shared/providers/NotificationProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 hover:bg-toss-bg transition-colors"
      >
        <Bell className={cn(
          "h-6 w-6 transition-colors",
          unreadCount > 0 ? "text-toss-blue" : "text-toss-text-secondary"
        )} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-toss-red text-[10px] font-bold text-white border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 rounded-2xl bg-white dark:bg-gray-800 shadow-toss-large border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-toss-text-primary">알림</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[12px] font-medium text-toss-blue hover:underline"
                >
                  모두 읽음 처리
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group cursor-pointer",
                      !notification.isRead && "bg-toss-blue/5 dark:bg-toss-blue/10"
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.stockCode) {
                        router.push(`/stocks/${notification.stockCode}`);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                       <h4 className="text-[14px] font-bold text-toss-text-primary mb-1">{notification.title}</h4>
                       {!notification.isRead && <div className="h-2 w-2 rounded-full bg-toss-blue mt-1.5 shrink-0" />}
                    </div>
                    <p className="text-[13px] text-toss-text-secondary line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                       <span className="text-[11px] text-toss-text-placeholder">
                         {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ko })}
                       </span>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           deleteNotification(notification.id);
                         }}
                         className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-toss-red/10 text-toss-text-placeholder hover:text-toss-red transition-all"
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center">
                  <Bell className="h-10 w-10 text-toss-text-placeholder mx-auto mb-3 opacity-20" />
                  <p className="text-[14px] text-toss-text-secondary">새로운 알림이 없습니다.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
