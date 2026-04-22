import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  // Department session (saved when worker logs in via PIN)
  departmentUser: User | null;
  departmentToken: string | null;
  // Telegram auth
  telegramCode: string | null;
  telegramCodeExpiry: number | null;
  isTelegramAuth: boolean;
  pollingIntervalId: NodeJS.Timeout | null;

  login: (email: string, password: string) => Promise<void>;
  quickLogin: (code: string) => Promise<void>;
  pinLogin: (pin: string) => Promise<void>;
  logout: () => void;
  returnToDepartment: () => boolean;
  initializeAuth: () => void;
  refreshUser: () => Promise<void>;
  requestTelegramCode: (email: string, password: string) => Promise<void>;
  startTelegramPolling: (code: string) => void;
  stopTelegramPolling: () => void;
  resetTelegramAuth: () => void;
}

const readStoredAuth = (): { user: User | null; token: string | null } => {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const token = window.localStorage.getItem('token');
    const userStr = window.localStorage.getItem('user');
    if (!token || !userStr) return { user: null, token: null };
    return { user: JSON.parse(userStr) as User, token };
  } catch {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    return { user: null, token: null };
  }
};

const storedAuth = readStoredAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedAuth.user,
  token: storedAuth.token,
  isLoading: false,
  error: null,
  departmentUser: null,
  departmentToken: null,
  telegramCode: null,
  telegramCodeExpiry: null,
  isTelegramAuth: false,
  pollingIntervalId: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({
        user: response.user,
        token: response.access_token,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Ошибка авторизации',
        isLoading: false,
      });
      throw error;
    }
  },

  quickLogin: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.quickLogin(code);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({
        user: response.user,
        token: response.access_token,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Не удалось войти через отдел',
        isLoading: false,
      });
      throw error;
    }
  },

  pinLogin: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      // Save current department session before replacing
      const currentUser = get().user;
      const currentToken = get().token;
      if (currentUser && currentToken) {
        localStorage.setItem('departmentToken', currentToken);
        localStorage.setItem('departmentUser', JSON.stringify(currentUser));
      }

      const response = await authApi.pinLogin(pin);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({
        user: response.user,
        token: response.access_token,
        departmentUser: currentUser,
        departmentToken: currentToken,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Неверный PIN-код',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    const { stopTelegramPolling } = get();
    stopTelegramPolling();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('departmentToken');
    localStorage.removeItem('departmentUser');
    set({ user: null, token: null, departmentUser: null, departmentToken: null });
  },

  returnToDepartment: () => {
    const deptToken = localStorage.getItem('departmentToken');
    const deptUserStr = localStorage.getItem('departmentUser');
    if (deptToken && deptUserStr) {
      try {
        const deptUser = JSON.parse(deptUserStr);
        localStorage.setItem('token', deptToken);
        localStorage.setItem('user', deptUserStr);
        localStorage.removeItem('departmentToken');
        localStorage.removeItem('departmentUser');
        set({ user: deptUser, token: deptToken, departmentUser: null, departmentToken: null });
        return true;
      } catch {
        // Invalid stored data, fall through
      }
    }
    return false;
  },

  initializeAuth: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  refreshUser: async () => {
    try {
      const profile = await authApi.getProfile();
      localStorage.setItem('user', JSON.stringify(profile));
      set({ user: profile });
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  },

  requestTelegramCode: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.requestTelegramCode({ email, password });
      const expiryTime = Date.now() + response.expiresIn * 1000;
      set({
        telegramCode: response.code,
        telegramCodeExpiry: expiryTime,
        isTelegramAuth: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Ошибка запроса кода',
        isLoading: false,
      });
      throw error;
    }
  },

  startTelegramPolling: (code: string) => {
    const { stopTelegramPolling } = get();
    stopTelegramPolling(); // Остановим предыдущий polling, если есть

    const intervalId = setInterval(async () => {
      try {
        const response = await authApi.checkTelegramAuth({ code });

        // Если получили токен - авторизация успешна
        if (response.access_token && response.user) {
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          set({
            user: response.user,
            token: response.access_token,
            isTelegramAuth: false,
            telegramCode: null,
            telegramCodeExpiry: null,
            error: null,
          });
          stopTelegramPolling();
        }
      } catch (error: any) {
        // Если код истёк или неверный, останавливаем polling
        if (error.response?.status === 401) {
          set({
            error: error.response?.data?.message || 'Код истёк или неверный',
            isTelegramAuth: false,
            telegramCode: null,
            telegramCodeExpiry: null,
          });
          stopTelegramPolling();
        }
      }
    }, 2000); // Проверяем каждые 2 секунды

    set({ pollingIntervalId: intervalId });
  },

  stopTelegramPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },

  resetTelegramAuth: () => {
    const { stopTelegramPolling } = get();
    stopTelegramPolling();
    set({
      isTelegramAuth: false,
      telegramCode: null,
      telegramCodeExpiry: null,
      error: null,
    });
  },
}));
