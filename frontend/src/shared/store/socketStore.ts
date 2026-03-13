import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface StockPrice {
  stockCode: string;
  stockName?: string;
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  market?: string;
  per?: number;
  pbr?: number;
  eps?: number;
  marketCap?: number;
  dividendYield?: number;
  timestamp: Date;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  stockPrices: Record<string, StockPrice>;
  notifications: any[];
  connect: (userId?: string) => void;
  disconnect: () => void;
  setStockPrice: (data: StockPrice) => void;
  addNotification: (notification: any) => void;
  subscribeToUser: (userId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  stockPrices: {},
  notifications: [],

  connect: (userId?: string) => {
    const { socket } = get();
    if (socket?.connected) {
      if (userId) get().subscribeToUser(userId);
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
    const newSocket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      set({ isConnected: true });
      if (userId) {
        newSocket.emit('user:subscribe', userId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      set({ isConnected: false });
    });

    newSocket.on('notification:new', (notification) => {
      get().addNotification(notification);
    });

    newSocket.on('stock:price', (data: StockPrice) => {
      get().setStockPrice(data);
    });

    set({ socket: newSocket });
  },

  subscribeToUser: (userId: string) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
      socket.emit('user:subscribe', userId);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  setStockPrice: (data) => {
    set((state) => ({
      stockPrices: {
        ...state.stockPrices,
        [data.stockCode]: data,
      },
    }));
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
