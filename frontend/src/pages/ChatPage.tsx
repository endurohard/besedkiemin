import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useChat, ChatMessage } from '@/hooks/useChat';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface ChatRoom {
  id: string;
  catalogOrderId: string;
  customerName: string;
  isActive: boolean;
  lastMessageAt?: string;
  lastMessageText?: string;
  unreadCount: number;
  catalogOrder: {
    id: string;
    orderNumber: string;
    customerPhone: string;
    customerEmail?: string;
    status: string;
  };
  createdAt: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    messages,
    isTyping,
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    leaveRoom,
  } = useChat();

  // Загрузить список комнат при монтировании
  useEffect(() => {
    loadRooms();
  }, []);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отметить сообщения как прочитанные при выборе комнаты
  useEffect(() => {
    if (selectedRoom && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.senderType === 'CUSTOMER',
      );
      if (unreadMessages.length > 0) {
        markAsRead(
          selectedRoom.id,
          unreadMessages.map((m) => m.id),
        );
      }
    }
  }, [selectedRoom, messages]);

  const loadRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const response = await api.get('/chat/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Ошибка загрузки комнат:', error);
      alert('Не удалось загрузить список чатов');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    // Покинуть предыдущую комнату
    if (selectedRoom) {
      leaveRoom(selectedRoom.id);
    }

    // Присоединиться к новой комнате
    setSelectedRoom(room);
    joinRoom(room.id, 'manager', user?.userId);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedRoom || !user) return;

    sendMessage(
      selectedRoom.id,
      messageText,
      'MANAGER',
      `${user.firstName} ${user.lastName}`,
      user.userId,
    );
    setMessageText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    stopTyping(selectedRoom.id);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    if (!selectedRoom) return;

    // Отправить индикатор набора
    startTyping(selectedRoom.id, 'manager', `${user?.firstName} ${user?.lastName}`);

    // Сбросить таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Остановить индикатор через 2 секунды бездействия
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedRoom.id);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Список диалогов */}
      <Card className="w-96 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Чаты с клиентами</CardTitle>
            <button
              onClick={loadRooms}
              className="text-blue-600 hover:text-blue-700 p-1"
              title="Обновить"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {isConnected ? '🟢 Онлайн' : '🔴 Нет связи'}
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {isLoadingRooms ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Загрузка...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <p>Нет активных чатов</p>
            </div>
          ) : (
            <div className="divide-y">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition ${selectedRoom?.id === room.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{room.customerName}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {room.catalogOrder.orderNumber}
                      </p>
                      {room.lastMessageText && (
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {room.lastMessageText}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end ml-2">
                      {room.lastMessageAt && (
                        <p className="text-xs text-gray-400">{formatTime(room.lastMessageAt)}</p>
                      )}
                      {room.unreadCount > 0 && (
                        <span className="mt-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Окно чата */}
      <Card className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Заголовок чата */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedRoom.customerName}</CardTitle>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span>📋 {selectedRoom.catalogOrder.orderNumber}</span>
                    <span>📞 {selectedRoom.catalogOrder.customerPhone}</span>
                    {selectedRoom.catalogOrder.customerEmail && (
                      <span>✉️ {selectedRoom.catalogOrder.customerEmail}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Сообщения */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Начните разговор с клиентом</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'MANAGER' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.senderType === 'MANAGER'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {msg.senderType === 'CUSTOMER' && (
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${msg.senderType === 'MANAGER' ? 'text-blue-100' : 'text-gray-400'}`}
                      >
                        {formatTime(msg.createdAt)}
                        {msg.senderType === 'MANAGER' && msg.isRead && ' ✓✓'}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Поле ввода */}
            <div className="border-t p-4 bg-white">
              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите сообщение..."
                  disabled={!isConnected}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || !isConnected}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  Отправить
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg
                className="w-20 h-20 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>Выберите чат из списка слева</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ChatPage;
