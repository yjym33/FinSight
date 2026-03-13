'use client';

import { useCallback } from 'react';
import { useSocketStore } from '@/shared/store/socketStore';

export function useWebSocket() {
  const { socket, isConnected, stockPrices } = useSocketStore();

  const subscribeStock = useCallback(
    (stockCode: string) => {
      if (socket && isConnected) {
        socket.emit('stock:subscribe', stockCode);
      }
    },
    [socket, isConnected]
  );

  const unsubscribeStock = useCallback(
    (stockCode: string) => {
      if (socket && isConnected) {
        socket.emit('stock:unsubscribe', stockCode);
      }
    },
    [socket, isConnected]
  );

  return {
    socket,
    stockPrices,
    isConnected,
    subscribeStock,
    unsubscribeStock,
  };
}
