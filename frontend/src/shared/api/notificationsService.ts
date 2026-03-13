import api from '@/shared/api/api';

export interface Notification {
  id: string;
  type: 'PRICE_ALARM' | 'NEWS_KEYWORD' | 'COMMUNITY_REPLY' | 'AI_REPORT';
  title: string;
  message: string;
  stockCode?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export const notificationsService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
