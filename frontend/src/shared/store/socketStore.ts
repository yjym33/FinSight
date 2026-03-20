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
  isConnecting: boolean;
  stockPrices: Record<string, StockPrice>;
  notifications: any[];
  connect: (userId?: string) => void;
  disconnect: () => void;
  setStockPrice: (data: StockPrice) => void;
  addNotification: (notification: any) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  stockPrices: {},
  notifications: [],

  connect: (userId?: string) => {
    const state = get();
    
    // 1. 이미 연결되어 있는 경우
    if (state.socket?.connected) {
      if (userId) {
        state.socket.emit('user:subscribe', userId);
      }
      return;
    }

    // 2. 이미 연결 시도 중인 경우 중복 처리 방지
    if (state.isConnecting) {
      console.log('Socket connection already in progress...');
      return;
    }

    set({ isConnecting: true });
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
    
    // 3. 소켓 인스턴스가 없거나 새로 생성해야 하는 경우
    const newSocket = state.socket || io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false, // 명시적으로 connect() 호출
    });

    // 리스너 중복 등록 방지
    if (newSocket.listeners('connect').length === 0) {
      newSocket.on('connect', () => {
        console.log('WebSocket connected:', newSocket.id);
        set({ isConnected: true, isConnecting: false });
        if (userId) {
          newSocket.emit('user:subscribe', userId);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        set({ isConnected: false, isConnecting: false });
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        set({ isConnected: false, isConnecting: false });
      });

      newSocket.on('stock:price', (data: StockPrice) => {
        get().setStockPrice(data);
      });

      newSocket.on('notification:new', (notification) => {
        get().addNotification(notification);
      });
    }

    // 명시적으로 연결 시작
    if (!newSocket.connected) {
      newSocket.connect();
    }

    set({ socket: newSocket });
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
      console.log('Manually disconnecting socket');
      socket.disconnect();
      set({ socket: null, isConnected: false, isConnecting: false });
    }
  },
}));
