import { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, PhoneIncoming, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { usePhoneSIP, type Call } from '@/hooks/usePhoneSIP';
import { useAuthStore } from '@/store/authStore';

export const PhoneWidget = () => {
  const { user } = useAuthStore();
  const {
    isRegistered,
    isRegistering,
    error,
    calls,
    makeCall,
    answerCall,
    hangupCall,
    rejectCall,
  } = usePhoneSIP(user);

  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callDurations, setCallDurations] = useState<Record<string, number>>({});

  // Если нет SIP данных, не показываем виджет
  if (!user?.sipServer || !user?.sipUser || !user?.sipPassword) {
    return null;
  }

  // Обновление длительности звонков
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDurations(prev => {
        const newDurations = { ...prev };
        calls.forEach(call => {
          if (call.status === 'connected' && call.startTime) {
            const duration = Math.floor((Date.now() - call.startTime.getTime()) / 1000);
            newDurations[call.id] = duration;
          }
        });
        return newDurations;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [calls]);

  // Форматирование времени
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMakeCall = () => {
    if (phoneNumber.trim()) {
      makeCall(phoneNumber.trim());
      setPhoneNumber('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMakeCall();
    }
  };

  // Статус индикатор
  const getStatusColor = () => {
    if (isRegistered) return 'bg-green-500';
    if (isRegistering) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isRegistered) return 'Подключено';
    if (isRegistering) return 'Подключение...';
    return 'Не подключено';
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Уведомление о входящих звонках */}
        {calls.some(c => c.direction === 'incoming' && c.status === 'ringing') && (
          <div className="absolute -top-2 -right-2 animate-pulse">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          </div>
        )}

        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`rounded-full w-14 h-14 shadow-lg ${
            calls.length > 0 ? 'bg-green-600 hover:bg-green-700' : ''
          }`}
        >
          {calls.length > 0 ? (
            <PhoneCall className="w-6 h-6" />
          ) : (
            <Phone className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Phone Widget Panel */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-96 shadow-2xl">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <h3 className="font-semibold">Телефония</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                  <span className="text-xs text-muted-foreground">
                    {getStatusText()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                {error}
              </div>
            )}

            {/* Active Calls */}
            {calls.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Активные звонки
                </h4>
                {calls.map(call => (
                  <CallCard
                    key={call.id}
                    call={call}
                    duration={callDurations[call.id]}
                    onAnswer={answerCall}
                    onHangup={hangupCall}
                    onReject={rejectCall}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            )}

            {/* Dialer */}
            {isRegistered && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Набрать номер
                </h4>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isRegistered}
                  />
                  <Button
                    onClick={handleMakeCall}
                    disabled={!phoneNumber.trim() || !isRegistered}
                    className="flex-shrink-0"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="text-xs text-muted-foreground border-t pt-3">
              <div>SIP: {user?.sipUser}@{user?.sipServer}</div>
              <div>Пользователь: {user?.firstName} {user?.lastName}</div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

// Call Card Component
interface CallCardProps {
  call: Call;
  duration?: number;
  onAnswer: (callId: string) => void;
  onHangup: (callId: string) => void;
  onReject: (callId: string) => void;
  formatDuration: (seconds: number) => string;
}

const CallCard = ({
  call,
  duration,
  onAnswer,
  onHangup,
  onReject,
  formatDuration,
}: CallCardProps) => {
  const getStatusIcon = () => {
    switch (call.status) {
      case 'ringing':
        return call.direction === 'incoming' ? (
          <PhoneIncoming className="w-4 h-4 animate-pulse text-green-500" />
        ) : (
          <PhoneCall className="w-4 h-4 animate-pulse text-blue-500" />
        );
      case 'connecting':
        return <PhoneCall className="w-4 h-4 text-yellow-500" />;
      case 'connected':
        return <PhoneCall className="w-4 h-4 text-green-500" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (call.status) {
      case 'ringing':
        return call.direction === 'incoming' ? 'Входящий звонок' : 'Вызов...';
      case 'connecting':
        return 'Соединение...';
      case 'connected':
        return duration ? formatDuration(duration) : 'Разговор';
      default:
        return 'Звонок';
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <div className="font-medium">{call.remoteNumber}</div>
            <div className="text-xs text-muted-foreground">{getStatusText()}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {call.status === 'ringing' && call.direction === 'incoming' && (
          <>
            <Button
              size="sm"
              onClick={() => onAnswer(call.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <PhoneCall className="w-4 h-4 mr-1" />
              Ответить
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(call.id)}
              className="flex-1"
            >
              <PhoneOff className="w-4 h-4 mr-1" />
              Отклонить
            </Button>
          </>
        )}

        {(call.status === 'connected' ||
          call.status === 'connecting' ||
          (call.status === 'ringing' && call.direction === 'outgoing')) && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onHangup(call.id)}
            className="flex-1"
          >
            <PhoneOff className="w-4 h-4 mr-1" />
            Завершить
          </Button>
        )}
      </div>
    </div>
  );
};
