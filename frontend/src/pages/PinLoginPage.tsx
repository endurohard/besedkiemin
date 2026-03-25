import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const PinLoginPage = () => {
  const [pin, setPin] = useState('');
  const { pinLogin, isLoading, error, user } = useAuthStore();
  const navigate = useNavigate();
  const pinLoginDone = useRef(false);

  // Редирект только после успешного PIN-входа (не при загрузке страницы)
  useEffect(() => {
    if (user && pinLoginDone.current) {
      navigate('/app/my-earnings');
    }
  }, [user, navigate]);

  const handleDigit = useCallback((digit: string) => {
    setPin(prev => {
      if (prev.length >= 6) return prev;
      return prev + digit;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length < 4) return;
    try {
      pinLoginDone.current = true;
      await pinLogin(pin);
    } catch {
      setPin('');
    }
  }, [pin, pinLogin]);

  // Auto-submit when PIN is 4+ digits
  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleSubmit]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Личный кабинет</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Введите ваш PIN-код
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PIN dots */}
          <div className="flex justify-center gap-3 py-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? 'bg-blue-600 border-blue-600 scale-110'
                    : 'border-gray-300'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded text-center">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              Проверка...
            </div>
          )}

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;
              if (d === 'del') {
                return (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-14 text-lg"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    &#x232B;
                  </Button>
                );
              }
              return (
                <Button
                  key={i}
                  variant="outline"
                  className="h-14 text-xl font-semibold"
                  onClick={() => handleDigit(d)}
                  disabled={isLoading}
                >
                  {d}
                </Button>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Назад
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
