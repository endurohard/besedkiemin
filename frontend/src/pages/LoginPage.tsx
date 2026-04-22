import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';
import { departmentPresetsApi, PublicDepartmentPreset } from '@/lib/api';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTelegramLogin, setShowTelegramLogin] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const {
    login,
    quickLogin,
    isLoading,
    error,
    isTelegramAuth,
    telegramCode,
    telegramCodeExpiry,
    requestTelegramCode,
    startTelegramPolling,
    resetTelegramAuth,
    user,
  } = useAuthStore();

  const { data: departmentPresets = [] } = useQuery({
    queryKey: ['department-presets-public'],
    queryFn: () => departmentPresetsApi.getPublic(),
    staleTime: 60_000,
    retry: 1,
  });

  const navigate = useNavigate();

  // Перенаправление при успешной авторизации
  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  // Таймер для кода Telegram
  useEffect(() => {
    if (telegramCodeExpiry) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((telegramCodeExpiry - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          resetTelegramAuth();
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [telegramCodeExpiry, resetTelegramAuth]);

  // Запуск polling при получении кода
  useEffect(() => {
    if (telegramCode && isTelegramAuth) {
      startTelegramPolling(telegramCode);
    }
  }, [telegramCode, isTelegramAuth, startTelegramPolling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Ошибка уже обработана в store
    }
  };

  const handleDepartmentLogin = async (code: string) => {
    try {
      await quickLogin(code);
    } catch (err) {
      // Ошибка уже обработана в store
    }
  };

  const colorStyles: Record<string, string> = {
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
    green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    blue: 'bg-primary/10 hover:bg-primary/20 text-primary border-blue-200',
    teal: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200',
    red: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
    gray: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200',
  };
  const getPresetClass = (preset: PublicDepartmentPreset) =>
    colorStyles[preset.color] ?? colorStyles.blue;

  const handleTelegramLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestTelegramCode(email, password);
    } catch (err) {
      // Ошибка уже обработана в store
    }
  };

  const handleCancelTelegram = () => {
    resetTelegramAuth();
    setShowTelegramLogin(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center admin-theme bg-gradient-to-br from-[#21222d] to-[#171821] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Besedki EMIN</CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Система управления производством
          </p>
        </CardHeader>
        <CardContent>
          {!isTelegramAuth ? (
            // Обычный вход или выбор метода
            <form onSubmit={showTelegramLogin ? handleTelegramLogin : handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Логин
                </label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@factory.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                {!showTelegramLogin ? (
                  <>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Вход...' : 'Войти'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowTelegramLogin(true)}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.725 8.126c-.13.617-.473.769-.957.479l-2.645-1.95-1.276 1.229c-.142.142-.26.26-.533.26l.19-2.698 4.897-4.422c.213-.19-.047-.295-.33-.105l-6.05 3.81-2.604-.814c-.566-.177-.578-.566.117-.837l10.184-3.924c.472-.177.884.105.73.837z" />
                      </svg>
                      Войти через Telegram
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Получение кода...' : 'Получить код для Telegram'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowTelegramLogin(false)}
                    >
                      Назад к обычному входу
                    </Button>
                  </>
                )}
              </div>

              {/* Быстрый вход в отдел */}
              {departmentPresets.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Выберите отдел
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {departmentPresets.map((preset) => (
                      <button
                        key={preset.code}
                        type="button"
                        onClick={() => handleDepartmentLogin(preset.code)}
                        disabled={isLoading}
                        className={`p-3 rounded-lg font-medium transition-colors border disabled:opacity-50 ${getPresetClass(preset)}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            // Отображение кода Telegram
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.725 8.126c-.13.617-.473.769-.957.479l-2.645-1.95-1.276 1.229c-.142.142-.26.26-.533.26l.19-2.698 4.897-4.422c.213-.19-.047-.295-.33-.105l-6.05 3.81-2.604-.814c-.566-.177-.578-.566.117-.837l10.184-3.924c.472-.177.884.105.73.837z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Войдите через Telegram</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Отправьте следующую команду боту @besedkiemin_bot в Telegram:
                </p>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary/20">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Ваш код:</p>
                  <div className="text-4xl font-bold text-primary tracking-wider mb-2 font-mono">
                    {telegramCode}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Действителен: <span className="font-semibold">{formatTime(timeLeft)}</span>
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Инструкция:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Откройте Telegram</li>
                  <li>Найдите бота @besedkiemin_bot</li>
                  <li>Отправьте команду: <code className="bg-card px-2 py-1 rounded">/login {telegramCode}</code></li>
                  <li>Дождитесь подтверждения</li>
                </ol>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Ожидание подтверждения в Telegram...
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCancelTelegram}
              >
                Отмена
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
