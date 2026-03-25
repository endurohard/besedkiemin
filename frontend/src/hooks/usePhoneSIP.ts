import { useEffect, useState, useCallback, useRef } from 'react';
import JsSIP from 'jssip';
import type { User } from '@/types';

// Типы для звонков
export interface Call {
  id: string;
  direction: 'incoming' | 'outgoing';
  remoteNumber: string;
  status: 'ringing' | 'connecting' | 'connected' | 'ended';
  startTime?: Date;
  duration?: number;
  session: any; // JsSIP.RTCSession
}

export interface PhoneSIPConfig {
  server: string;
  user: string;
  password: string;
  port?: number;
  wsPort?: number;
  displayName?: string;
}

export const usePhoneSIP = (user: User | null) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);

  const uaRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Инициализация SIP UA
  const initializeSIP = useCallback((config: PhoneSIPConfig) => {
    // Очищаем предыдущее соединение
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
    }

    try {
      // Настройка JsSIP
      JsSIP.debug.enable('JsSIP:*');

      // Asterisk использует ws:// без SSL на порту 8088
      const wsUrl = `ws://${config.server}:${config.wsPort || 8088}/ws`;
      console.log('[usePhoneSIP] Connecting to WebSocket:', wsUrl);

      const socket = new JsSIP.WebSocketInterface(wsUrl);

      const configuration = {
        sockets: [socket],
        uri: `sip:${config.user}@${config.server}`,
        password: config.password,
        display_name: config.displayName || config.user,
        session_timers: false,
        register: true,
        register_expires: 600,
      };

      console.log('[usePhoneSIP] SIP Configuration:', {
        uri: configuration.uri,
        display_name: configuration.display_name,
      });

      const ua = new JsSIP.UA(configuration);

      // События регистрации
      ua.on('registered', () => {
        console.log('SIP registered successfully');
        setIsRegistered(true);
        setIsRegistering(false);
        setError(null);
      });

      ua.on('unregistered', () => {
        console.log('SIP unregistered');
        setIsRegistered(false);
      });

      ua.on('registrationFailed', (e: any) => {
        console.error('[usePhoneSIP] SIP registration failed:', e);
        console.error('[usePhoneSIP] Failure cause:', e.cause);
        console.error('[usePhoneSIP] Response:', e.response);
        const errorMsg = `Ошибка регистрации: ${e.cause || 'Неизвестная ошибка'}`;
        setError(errorMsg);
        setIsRegistering(false);
        setIsRegistered(false);
      });

      // События звонков
      ua.on('newRTCSession', (data: any) => {
        const session = data.session;
        const callId = session.id;
        const remoteNumber = session.remote_identity.uri.user;

        console.log('New RTC session:', callId, remoteNumber);

        if (session.direction === 'incoming') {
          // Входящий звонок
          const call: Call = {
            id: callId,
            direction: 'incoming',
            remoteNumber,
            status: 'ringing',
            session,
          };

          setCalls(prev => [...prev, call]);

          // События входящего звонка
          session.on('accepted', () => {
            console.log('Call accepted');
            setCalls(prev =>
              prev.map(c =>
                c.id === callId
                  ? { ...c, status: 'connected', startTime: new Date() }
                  : c
              )
            );
          });

          session.on('ended', () => {
            console.log('Call ended');
            setCalls(prev => prev.filter(c => c.id !== callId));
          });

          session.on('failed', () => {
            console.log('Call failed');
            setCalls(prev => prev.filter(c => c.id !== callId));
          });
        } else {
          // Исходящий звонок (уже добавлен в makeCall)
          session.on('connecting', () => {
            console.log('Call connecting');
            setCalls(prev =>
              prev.map(c => (c.id === callId ? { ...c, status: 'connecting' } : c))
            );
          });

          session.on('accepted', () => {
            console.log('Call accepted');
            setCalls(prev =>
              prev.map(c =>
                c.id === callId
                  ? { ...c, status: 'connected', startTime: new Date() }
                  : c
              )
            );
          });

          session.on('ended', () => {
            console.log('Call ended');
            setCalls(prev => prev.filter(c => c.id !== callId));
          });

          session.on('failed', () => {
            console.log('Call failed');
            setCalls(prev => prev.filter(c => c.id !== callId));
          });
        }

        // Настройка аудио потока
        session.on('peerconnection', (e: any) => {
          const peerConnection = e.peerconnection;
          peerConnection.addEventListener('addstream', (event: any) => {
            const remoteStream = event.stream;
            if (!audioRef.current) {
              audioRef.current = new Audio();
              audioRef.current.autoplay = true;
            }
            audioRef.current.srcObject = remoteStream;
          });
        });
      });

      // Запускаем UA
      ua.start();
      uaRef.current = ua;
      setIsRegistering(true);

    } catch (err: any) {
      console.error('Failed to initialize SIP:', err);
      setError(`Ошибка инициализации: ${err.message}`);
      setIsRegistering(false);
    }
  }, []);

  // Совершить звонок
  const makeCall = useCallback((phoneNumber: string) => {
    if (!uaRef.current || !isRegistered) {
      setError('SIP не подключен');
      return;
    }

    try {
      const eventHandlers = {
        progress: () => console.log('Call is in progress'),
        failed: (e: any) => console.error('Call failed:', e),
        ended: () => console.log('Call ended'),
        confirmed: () => console.log('Call confirmed'),
      };

      const options = {
        eventHandlers,
        mediaConstraints: {
          audio: true,
          video: false,
        },
      };

      const session = uaRef.current.call(`sip:${phoneNumber}@${user?.sipServer}`, options);

      const call: Call = {
        id: session.id,
        direction: 'outgoing',
        remoteNumber: phoneNumber,
        status: 'ringing',
        session,
      };

      setCalls(prev => [...prev, call]);
      setError(null);
    } catch (err: any) {
      console.error('Failed to make call:', err);
      setError(`Ошибка звонка: ${err.message}`);
    }
  }, [isRegistered, user]);

  // Ответить на звонок
  const answerCall = useCallback((callId: string) => {
    const call = calls.find(c => c.id === callId);
    if (!call || !call.session) return;

    try {
      call.session.answer({
        mediaConstraints: {
          audio: true,
          video: false,
        },
      });
      setError(null);
    } catch (err: any) {
      console.error('Failed to answer call:', err);
      setError(`Ошибка ответа: ${err.message}`);
    }
  }, [calls]);

  // Завершить звонок
  const hangupCall = useCallback((callId: string) => {
    const call = calls.find(c => c.id === callId);
    if (!call || !call.session) return;

    try {
      call.session.terminate();
      setError(null);
    } catch (err: any) {
      console.error('Failed to hangup call:', err);
      setError(`Ошибка завершения: ${err.message}`);
    }
  }, [calls]);

  // Отклонить звонок
  const rejectCall = useCallback((callId: string) => {
    const call = calls.find(c => c.id === callId);
    if (!call || !call.session) return;

    try {
      call.session.terminate();
      setError(null);
    } catch (err: any) {
      console.error('Failed to reject call:', err);
      setError(`Ошибка отклонения: ${err.message}`);
    }
  }, [calls]);

  // Отключиться от SIP
  const disconnect = useCallback(() => {
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
      setIsRegistered(false);
      setIsRegistering(false);
      setCalls([]);
      setError(null);
    }
  }, []);

  // Автоматическое подключение при наличии SIP данных
  useEffect(() => {
    if (
      user &&
      user.sipServer &&
      user.sipUser &&
      user.sipPassword &&
      !uaRef.current
    ) {
      const config: PhoneSIPConfig = {
        server: user.sipServer,
        user: user.sipUser,
        password: user.sipPassword,
        port: user.sipPort || 5060,
        wsPort: user.sipWsPort || 8088,
        displayName: `${user.firstName} ${user.lastName}`,
      };

      initializeSIP(config);
    }

    // Cleanup при размонтировании
    return () => {
      if (uaRef.current) {
        uaRef.current.stop();
      }
    };
  }, [user, initializeSIP]);

  return {
    isRegistered,
    isRegistering,
    error,
    calls,
    makeCall,
    answerCall,
    hangupCall,
    rejectCall,
    disconnect,
  };
};
