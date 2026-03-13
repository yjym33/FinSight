import api from '@/shared/api/api';

export interface StockComment {
  id: number;
  stockCode: string;
  nickname: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: {
    nickname: string;
  };
  commentCount: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  stockCode?: string;
}

export interface CommunityComment {
  id: string;
  content: string;
  authorId: string;
  author: {
    nickname: string;
  };
  parentId?: string;
  replies?: CommunityComment[];
  createdAt: string;
}

export const communityService = {
  // Anonymous Stock Comments
  getComments: async (stockCode: string, limit = 50): Promise<StockComment[]> => {
    const response = await api.get(`/community/stocks/${stockCode}/comments`, {
      params: { limit },
    });
    return response.data;
  },

  postStockComment: async (stockCode: string, content: string): Promise<StockComment> => {
    const response = await api.post('/community/stock-comments', {
      stockCode,
      content,
    });
    return response.data;
  },

  // Account-based Community Posts
  getPosts: async (stockCode?: string) => {
    const response = await api.get('/community/posts', { params: { stockCode } });
    return response.data;
  },

  getPost: async (id: string) => {
    const response = await api.get(`/community/posts/${id}`);
    return response.data;
  },

  createPost: async (data: { title: string; content: string; stockCode?: string }) => {
    const response = await api.post('/community/posts', data);
    return response.data;
  },

  createComment: async (data: { content: string; postId: string; parentId?: string }) => {
    const response = await api.post('/community/comments', data);
    return response.data;
  },
};
