import React, { useState, useEffect, useRef } from 'react';
import { useChat, ChatMessage, OnlineStatus } from '@/hooks/useChat';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface CustomerChatWidgetProps {
  catalogOrderId?: string;
  customerName: string;
  customerPhone?: string;
}

export const CustomerChatWidget: React.FC<CustomerChatWidgetProps> = ({
  catalogOrderId,
  customerName,
  customerPhone,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({ online: false });
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [callbackForm, setCallbackForm] = useState({
    name: customerName,
    phone: customerPhone || '',
    message: '',
    preferredTime: '',
  });
  const [isSubmittingCallback, setIsSubmittingCallback] = useState(false);

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
    leaveRoom,
  } = useChat();

  // Проверить онлайн-статус при загрузке
  useEffect(() => {
    checkOnlineStatus();
  }, []);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkOnlineStatus = async () => {
    try {
      const response = await api.get('/chat/status');
      setOnlineStatus(response.data);
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
    }
  };

  const handleOpenChat = async () => {
    if (!catalogOrderId) {
      alert('Сначала оформите заказ, чтобы начать чат');
      return;
    }

    setIsOpen(true);
    setIsLoadingRoom(true);

    try {
      // Проверить статус перед открытием
      await checkOnlineStatus();

      // Создать или получить комнату
      const response = await api.post(`/chat/rooms/order/${catalogOrderId}`);
      const room = response.data;

      setRoomId(room.id);
      joinRoom(room.id, 'customer');
    } catch (error) {
      console.error('Ошибка открытия чата:', error);
      alert('Не удалось открыть чат. Попробуйте позже.');
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const handleCloseChat = () => {
    if (roomId) {
      leaveRoom(roomId);
    }
    setIsOpen(false);
    setRoomId(null);
    setShowOfflineForm(false);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !roomId) return;

    sendMessage(roomId, messageText, 'CUSTOMER', customerName);
    setMessageText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    stopTyping(roomId);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    if (!roomId) return;

    // Отправить индикатор набора
    startTyping(roomId, 'customer', customerName);

    // Сбросить таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Остановить индикатор через 2 секунды бездействия
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(roomId);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmitCallback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!callbackForm.name || !callbackForm.phone) {
      alert('Укажите имя и телефон');
      return;
    }

    setIsSubmittingCallback(true);

    try {
      await api.post('/callback-requests', {
        name: callbackForm.name,
        phone: callbackForm.phone,
        message: callbackForm.message || undefined,
        preferredTime: callbackForm.preferredTime || undefined,
        catalogOrderId: catalogOrderId || undefined,
      });

      alert('Заявка отправлена! Мы свяжемся с вами в рабочее время.');
      setShowOfflineForm(false);
      handleCloseChat();
    } catch (error) {
      console.error('Ошибка отправки заявки:', error);
      alert('Не удалось отправить заявку. Попробуйте позже.');
    } finally {
      setIsSubmittingCallback(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Кнопка-виджет (свернутый чат)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 z-50"
        title="Открыть чат"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    );
  }

  // Окно чата (развернутый)
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Заголовок */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Онлайн-консультант</h3>
          <p className="text-xs">
            {isConnected ? (
              onlineStatus.online ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Мы на связи
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  Оффлайн
                </span>
              )
            ) : (
              'Подключение...'
            )}
          </p>
        </div>
        <button
          onClick={handleCloseChat}
          className="hover:bg-blue-700 rounded p-1"
          title="Закрыть"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Сообщение о нерабочих часах */}
      {!onlineStatus.online && !showOfflineForm && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <p className="text-sm text-yellow-800">{onlineStatus.message}</p>
          {onlineStatus.workingHours && (
            <p className="text-xs text-yellow-700 mt-1">
              Рабочие часы: {onlineStatus.workingHours.start} - {onlineStatus.workingHours.end}
            </p>
          )}
          <button
            onClick={() => setShowOfflineForm(true)}
            className="mt-2 text-sm text-blue-600 hover:underline font-medium"
          >
            Оставить заявку на звонок →
          </button>
        </div>
      )}

      {/* Форма заявки на звонок (оффлайн режим) */}
      {showOfflineForm ? (
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="font-semibold mb-3">Заявка на обратный звонок</h4>
          <form onSubmit={handleSubmitCallback} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ваше имя *</label>
              <Input
                value={callbackForm.name}
                onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                placeholder="Иван Иванов"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Телефон *</label>
              <Input
                value={callbackForm.phone}
                onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
                placeholder="+7 (900) 123-45-67"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Сообщение</label>
              <textarea
                value={callbackForm.message}
                onChange={(e) => setCallbackForm({ ...callbackForm, message: e.target.value })}
                placeholder="Опишите ваш вопрос..."
                className="w-full border rounded p-2 text-sm"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Удобное время для звонка</label>
              <Input
                value={callbackForm.preferredTime}
                onChange={(e) => setCallbackForm({ ...callbackForm, preferredTime: e.target.value })}
                placeholder="Например: после 15:00"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmittingCallback}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmittingCallback ? 'Отправка...' : 'Отправить заявку'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowOfflineForm(false)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Назад
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {isLoadingRoom ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Загрузка чата...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <svg
                  className="w-16 h-16 mb-2 text-gray-300"
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
                <p>Начните разговор!</p>
                <p className="text-sm mt-1">Мы ответим вам в ближайшее время</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      msg.senderType === 'CUSTOMER'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {msg.senderType === 'MANAGER' && (
                      <p className="text-xs font-medium text-gray-600 mb-1">{msg.senderName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${msg.senderType === 'CUSTOMER' ? 'text-blue-100' : 'text-gray-400'}`}
                    >
                      {formatTime(msg.createdAt)}
                      {msg.senderType === 'CUSTOMER' && msg.isRead && ' ✓✓'}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
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
          </div>

          {/* Поле ввода */}
          <div className="border-t p-3 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                placeholder={onlineStatus.online ? 'Введите сообщение...' : 'Чат недоступен'}
                disabled={!isConnected || !roomId || !onlineStatus.online}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || !isConnected || !roomId || !onlineStatus.online}
                className="bg-blue-600 hover:bg-blue-700 px-4"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
