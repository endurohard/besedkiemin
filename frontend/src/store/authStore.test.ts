import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    pinLogin: vi.fn(),
    getProfile: vi.fn(),
    requestTelegramCode: vi.fn(),
    checkTelegramAuth: vi.fn(),
  },
}));

import { useAuthStore } from './authStore';
import { authApi } from '@/lib/api';

function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    departmentUser: null,
    departmentToken: null,
    telegramCode: null,
    telegramCodeExpiry: null,
    isTelegramAuth: false,
    pollingIntervalId: null,
  });
}

describe('authStore', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('login stores user+token and persists to localStorage', async () => {
    (authApi.login as any).mockResolvedValue({
      access_token: 'jwt-abc',
      user: { id: 'u1', email: 'a@x', firstName: 'A', lastName: 'X' },
    });

    await useAuthStore.getState().login('a@x', 'pass');

    const state = useAuthStore.getState();
    expect(state.token).toBe('jwt-abc');
    expect(state.user?.id).toBe('u1');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(localStorage.getItem('token')).toBe('jwt-abc');
  });

  it('login on failure sets error and rethrows, without touching token', async () => {
    (authApi.login as any).mockRejectedValue({
      response: { data: { message: 'Bad creds' } },
    });

    await expect(useAuthStore.getState().login('a@x', 'wrong')).rejects.toBeDefined();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.error).toBe('Bad creds');
    expect(state.isLoading).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logout clears store and localStorage (both session + department)', () => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@x' } as any,
      token: 'jwt',
      departmentUser: { id: 'd1', email: 'dept@x' } as any,
      departmentToken: 'dept-jwt',
    });
    localStorage.setItem('token', 'jwt');
    localStorage.setItem('user', '{}');
    localStorage.setItem('departmentToken', 'dept-jwt');
    localStorage.setItem('departmentUser', '{}');

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().departmentUser).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('departmentToken')).toBeNull();
  });

  it('initializeAuth restores from valid localStorage', () => {
    const user = { id: 'u9', email: 'x@y', firstName: 'X', lastName: 'Y' };
    localStorage.setItem('token', 'tok-9');
    localStorage.setItem('user', JSON.stringify(user));

    useAuthStore.getState().initializeAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBe('tok-9');
    expect(state.user?.id).toBe('u9');
  });

  it('initializeAuth wipes localStorage on corrupt JSON', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', '{not valid json');

    useAuthStore.getState().initializeAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('pinLogin saves prior department session before switching user', async () => {
    useAuthStore.setState({
      user: { id: 'dept-user', email: 'dept@x' } as any,
      token: 'dept-jwt',
    });

    (authApi.pinLogin as any).mockResolvedValue({
      access_token: 'worker-jwt',
      user: { id: 'worker', email: 'w@x' },
    });

    await useAuthStore.getState().pinLogin('1234');

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('worker');
    expect(state.token).toBe('worker-jwt');
    expect(state.departmentUser?.id).toBe('dept-user');
    expect(state.departmentToken).toBe('dept-jwt');
    expect(localStorage.getItem('departmentToken')).toBe('dept-jwt');
  });

  it('returnToDepartment restores saved dept session and returns true', () => {
    const deptUser = { id: 'dept-user', email: 'dept@x' };
    localStorage.setItem('departmentToken', 'dept-jwt');
    localStorage.setItem('departmentUser', JSON.stringify(deptUser));

    const ok = useAuthStore.getState().returnToDepartment();

    expect(ok).toBe(true);
    const state = useAuthStore.getState();
    expect(state.token).toBe('dept-jwt');
    expect(state.user?.id).toBe('dept-user');
    expect(localStorage.getItem('token')).toBe('dept-jwt');
    expect(localStorage.getItem('departmentToken')).toBeNull();
  });

  it('returnToDepartment returns false when no dept session is saved', () => {
    expect(useAuthStore.getState().returnToDepartment()).toBe(false);
  });

  it('requestTelegramCode stores code + expiry', async () => {
    (authApi.requestTelegramCode as any).mockResolvedValue({
      code: '654321',
      expiresIn: 300,
    });

    await useAuthStore.getState().requestTelegramCode('a@x', 'pass');

    const state = useAuthStore.getState();
    expect(state.telegramCode).toBe('654321');
    expect(state.isTelegramAuth).toBe(true);
    expect(state.telegramCodeExpiry).toBeGreaterThan(Date.now());
  });

  it('resetTelegramAuth clears telegram state', () => {
    useAuthStore.setState({
      telegramCode: '123',
      telegramCodeExpiry: Date.now() + 1000,
      isTelegramAuth: true,
      error: 'x',
    });

    useAuthStore.getState().resetTelegramAuth();

    const state = useAuthStore.getState();
    expect(state.telegramCode).toBeNull();
    expect(state.telegramCodeExpiry).toBeNull();
    expect(state.isTelegramAuth).toBe(false);
    expect(state.error).toBeNull();
  });
});
