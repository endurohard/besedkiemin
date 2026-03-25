import React, { useState, useEffect, useRef } from 'react';
import { useChat, OnlineStatus } from '@/hooks/useChat';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface CustomerChatWidgetProps {
  catalogOrderId?: string;
  customerName?: string;
  customerPhone?: string;
}

// Получить или создать гостевой session ID
const getGuestSessionId = (): string => {
  const storageKey = 'chat_guest_session_id';
  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
};

export const CustomerChatWidget: React.FC<CustomerChatWidgetProps> = ({
  catalogOrderId,
  customerName: initialCustomerName,
  customerPhone: initialCustomerPhone,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({ online: false });
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);
  const [guestName, setGuestName] = useState(initialCustomerName || '');
  const [guestPhone, setGuestPhone] = useState(initialCustomerPhone || '');
  const [callbackForm, setCallbackForm] = useState({
    name: initialCustomerName || '',
    phone: initialCustomerPhone || '',
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
    setIsOpen(true);

    // Если нет заказа и нет имени - показать форму ввода имени
    if (!catalogOrderId && !guestName) {
      setShowNameForm(true);
      return;
    }

    await startChat();
  };

  const startChat = async () => {
    setIsLoadingRoom(true);
    setShowNameForm(false);

    try {
      // Проверить статус перед открытием
      await checkOnlineStatus();

      let room;

      if (catalogOrderId) {
        // Создать или получить комнату для заказа
        const response = await api.post(`/chat/rooms/order/${catalogOrderId}`);
        room = response.data;
      } else {
        // Создать или получить гостевую комнату
        const response = await api.post('/chat/rooms/guest', {
          guestSessionId: getGuestSessionId(),
          customerName: guestName || 'Гость',
          customerPhone: guestPhone || undefined,
        });
        room = response.data;
      }

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
    setShowNameForm(false);
  };

  const currentCustomerName = guestName || initialCustomerName || 'Гость';

  const handleSendMessage = () => {
    if (!messageText.trim() || !roomId) return;

    sendMessage(roomId, messageText, 'CUSTOMER', currentCustomerName);
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
    startTyping(roomId, 'customer', currentCustomerName);

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
        className="fixed bottom-6 right-6 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#C5A55A] rounded-full p-4 shadow-[0_0_20px_rgba(197,165,90,.2)] border border-[#C5A55A]/30 transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(197,165,90,.3)] z-50"
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
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-[#1A1A1A] rounded-lg shadow-2xl flex flex-col z-50 border border-[#C5A55A]/30">
      {/* Заголовок */}
      <div className="bg-[#111] text-white p-4 rounded-t-lg flex items-center justify-between border-b border-[#C5A55A]/20">
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
          className="hover:bg-[#C5A55A]/20 rounded p-1 text-[#C5A55A]"
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
        <div className="bg-[#2A2A2A] border-b border-[#C5A55A]/20 p-3">
          <p className="text-sm text-gray-600">{onlineStatus.message}</p>
          {onlineStatus.workingHours && (
            <p className="text-xs text-gray-400 mt-1">
              Рабочие часы: {onlineStatus.workingHours.start} - {onlineStatus.workingHours.end}
            </p>
          )}
          <button
            onClick={() => setShowOfflineForm(true)}
            className="mt-2 text-sm text-[#C5A55A] hover:underline font-medium"
          >
            Оставить заявку на звонок →
          </button>
        </div>
      )}

      {/* Форма ввода имени гостя */}
      {showNameForm ? (
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="font-semibold mb-3 text-[#C5A55A]">Представьтесь, пожалуйста</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (guestName.trim()) {
                startChat();
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Ваше имя *</label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Как вас зовут?"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Телефон (необязательно)</label>
              <Input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+7 (900) 123-45-67"
              />
            </div>
            <Button
              type="submit"
              disabled={!guestName.trim()}
              className="w-full bg-[#C5A55A] hover:bg-[#D4AF37] text-[#111]"
            >
              Начать чат
            </Button>
          </form>
        </div>
      ) : showOfflineForm ? (
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="font-semibold mb-3 text-[#C5A55A]">Заявка на обратный звонок</h4>
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
                className="w-full border border-[#333] rounded p-2 text-sm bg-[#111] text-white placeholder-gray-600 focus:border-[#C5A55A] outline-none"
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
                className="flex-1 bg-[#C5A55A] hover:bg-[#D4AF37] text-[#111]"
              >
                {isSubmittingCallback ? 'Отправка...' : 'Отправить заявку'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowOfflineForm(false)}
                className="bg-[#333] hover:bg-[#444] text-white"
              >
                Назад
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#111]">
            {isLoadingRoom ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Загрузка чата...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <svg
                  className="w-16 h-16 mb-2 text-gray-600"
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
                        ? 'bg-[#C5A55A] text-[#111]'
                        : 'bg-[#2A2A2A] border border-[#333]'
                    }`}
                  >
                    {msg.senderType === 'MANAGER' && (
                      <p className="text-xs font-medium text-[#C5A55A] mb-1">{msg.senderName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words text-current">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${msg.senderType === 'CUSTOMER' ? 'text-[#111]/60' : 'text-gray-500'}`}
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
                <div className="bg-[#2A2A2A] border border-[#333] rounded-lg px-3 py-2">
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
          <div className="border-t border-[#C5A55A]/20 p-3 bg-[#1A1A1A] rounded-b-lg">
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
                className="bg-[#C5A55A] hover:bg-[#D4AF37] text-[#111] px-4"
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
