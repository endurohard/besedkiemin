import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

/**
 * Хук для подписки на real-time уведомления через WebSocket.
 * Автоматически инвалидирует react-query кеш при получении событий.
 */
export function useNotifications() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io('/notifications', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Notifications] Connected');
    });

    socket.on('shipments:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    });

    socket.on('defects:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      queryClient.invalidateQueries({ queryKey: ['defects-unaccepted-count'] });
    });

    socket.on('tasks:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socket.on('orders:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    socket.on('products:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    });

    socket.on('inventory:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    });

    socket.on('disconnect', () => {
      console.log('[Notifications] Disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient]);
}
