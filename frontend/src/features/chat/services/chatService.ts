import api from '@/shared/api/api';

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'bot';
  message: string;
  createdAt: string;
}

export const chatService = {
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get('/chat/sessions');
    return response.data;
  },

  createSession: async (): Promise<ChatSession> => {
    const response = await api.post('/chat/sessions');
    return response.data;
  },

  updateTitle: async (sessionId: string, title: string): Promise<ChatSession> => {
    const response = await api.patch(`/chat/sessions/${sessionId}/title`, {
      title,
    });
    return response.data;
  },

  getSession: async (sessionId: string): Promise<ChatSession> => {
    const response = await api.get(`/chat/sessions/${sessionId}`);
    return response.data;
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  },

  sendMessage: async (sessionId: string, message: string): Promise<ChatMessage> => {
    const response = await api.post(`/chat/sessions/${sessionId}/messages`, {
      message,
    });
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/chat/sessions/${sessionId}`);
  },
  
  getRecommendations: async (): Promise<string[]> => {
    const response = await api.get('/chat/recommendations');
    return response.data;
  },
};
