import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from '@/lib/api';
import { Button } from './ui/Button';
import { MessageCircle, X, CheckCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store/authStore';
import { TelegramIcon } from './TelegramIcon';

export const TelegramLinkWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, refreshUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Автоматическое обновление профиля каждые 3 секунды, когда окно открыто и Telegram не привязан
  useEffect(() => {
    if (isOpen && !user?.telegramId) {
      const interval = setInterval(() => {
        refreshUser();
      }, 3000); // Проверяем каждые 3 секунды

      return () => clearInterval(interval);
    }
  }, [isOpen, user?.telegramId, refreshUser]);

  const { data: telegramLink, isLoading } = useQuery({
    queryKey: ['telegram-link'],
    queryFn: telegramApi.getLink,
    enabled: !user?.telegramId && isOpen,
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/telegram/unlink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to unlink');
      return response.json();
    },
    onSuccess: async () => {
      await refreshUser(); // Обновляем данные пользователя
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      alert('Telegram отвязан');
      setIsOpen(false);
    },
    onError: () => {
      alert('Не удалось отвязать Telegram');
    },
  });

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          refreshUser(); // Обновляем данные пользователя при открытии
          setIsOpen(true);
        }}
        className="relative"
      >
        <TelegramIcon size={20} />
        {user?.telegramId && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </Button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed top-20 right-4 bg-white rounded-lg shadow-xl z-50 w-96 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Telegram-бот
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {user?.telegramId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Telegram привязан</p>
                <p className="text-sm text-green-700">
                  Вы получаете уведомления о новых задачах
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => unlinkMutation.mutate()}
              disabled={unlinkMutation.isPending}
              className="w-full"
            >
              {unlinkMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Отвязка...
                </>
              ) : (
                'Отвязать бота'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Привяжите свой Telegram для получения уведомлений о новых задачах
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : telegramLink?.link ? (
              <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <QRCodeSVG value={telegramLink.link} size={200} level="H" />
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Отсканируйте QR код камерой телефона
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    @{telegramLink.botUsername}
                  </p>
                </div>
                <a
                  href={telegramLink.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Или откройте ссылку вручную
                </a>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
};
