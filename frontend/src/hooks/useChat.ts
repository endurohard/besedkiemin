import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderType: 'CUSTOMER' | 'MANAGER';
  senderId?: string;
  senderName: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  catalogOrderId: string;
  customerName: string;
  isActive: boolean;
  lastMessageAt?: string;
  lastMessageText?: string;
  unreadCount: number;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface OnlineStatus {
  online: boolean;
  message?: string;
  workingHours?: { start: string; end: string };
}

export function useChat() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({ online: false });

  useEffect(() => {
    // Создать подключение
    socketRef.current = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    // Обработчики событий
    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socket.on('room_joined', (data: { room: ChatRoom; messages: ChatMessage[] }) => {
      console.log('📥 Joined room:', data.room.id);
      setCurrentRoom(data.room);
      setMessages(data.messages);
    });

    socket.on('new_message', (message: ChatMessage) => {
      console.log('📨 New message:', message);
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user_typing', () => {
      setIsTyping(true);
    });

    socket.on('user_stopped_typing', () => {
      setIsTyping(false);
    });

    socket.on('messages_read', (data: { roomId: string; messageIds?: string[] }) => {
      console.log('✓ Messages marked as read:', data);
      setMessages((prev) =>
        prev.map((msg) => {
          if (!data.messageIds || data.messageIds.includes(msg.id)) {
            return { ...msg, isRead: true, readAt: new Date().toISOString() };
          }
          return msg;
        }),
      );
    });

    socket.on('online_status', (status: OnlineStatus) => {
      console.log('🟢 Online status:', status);
      setOnlineStatus(status);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('❌ Socket error:', error.message);
    });

    // Cleanup при размонтировании
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Присоединиться к комнате
  const joinRoom = (roomId: string, userType: 'customer' | 'manager', userId?: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit('join_room', {
      roomId,
      userType,
      userId,
    });
  };

  // Отправить сообщение
  const sendMessage = (
    roomId: string,
    content: string,
    senderType: 'CUSTOMER' | 'MANAGER',
    senderName: string,
    senderId?: string,
  ) => {
    if (!socketRef.current || !content.trim()) return;

    socketRef.current.emit('send_message', {
      roomId,
      content: content.trim(),
      senderType,
      senderName,
      senderId,
    });
  };

  // Индикатор набора текста
  const startTyping = (roomId: string, userType: string, userName: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { roomId, userType, userName });
  };

  const stopTyping = (roomId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('stop_typing', { roomId });
  };

  // Отметить как прочитанное
  const markAsRead = (roomId: string, messageIds?: string[]) => {
    if (!socketRef.current) return;
    socketRef.current.emit('mark_as_read', { roomId, messageIds });
  };

  // Покинуть комнату
  const leaveRoom = (roomId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave_room', { roomId });
    setCurrentRoom(null);
    setMessages([]);
  };

  // Проверить онлайн-статус
  const checkOnline = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('check_online');
  };

  return {
    isConnected,
    currentRoom,
    messages,
    isTyping,
    onlineStatus,
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    leaveRoom,
    checkOnline,
  };
}
