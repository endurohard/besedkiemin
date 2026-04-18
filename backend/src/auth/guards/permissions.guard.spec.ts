import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

const makeCtx = (user: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext);

const makeGuard = (required: string[] | undefined, dbUser: any) => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
  const prisma = { user: { findUnique: jest.fn().mockResolvedValue(dbUser) } } as any;
  return new PermissionsGuard(reflector, prisma);
};

describe('PermissionsGuard', () => {
  it('passes when no permissions required', async () => {
    const guard = makeGuard(undefined, null);
    expect(await guard.canActivate(makeCtx({ userId: 'u1' }))).toBe(true);
  });

  it('denies when user missing', async () => {
    const guard = makeGuard(['users:view'], null);
    expect(await guard.canActivate(makeCtx(null))).toBe(false);
  });

  it('denies when user has no role in DB', async () => {
    const guard = makeGuard(['users:view'], { id: 'u1', role: null });
    expect(await guard.canActivate(makeCtx({ userId: 'u1' }))).toBe(false);
  });

  it('SUPER_ADMIN bypasses permission check', async () => {
    const guard = makeGuard(['users:delete'], {
      id: 'u1',
      role: { code: 'SUPER_ADMIN', permissions: [] },
    });
    expect(await guard.canActivate(makeCtx({ userId: 'u1' }))).toBe(true);
  });

  it('OWNER bypasses permission check', async () => {
    const guard = makeGuard(['users:delete'], {
      id: 'u1',
      role: { code: 'OWNER', permissions: [] },
    });
    expect(await guard.canActivate(makeCtx({ userId: 'u1' }))).toBe(true);
  });

  it('passes when all required permissions present', async () => {
    const guard = makeGuard(['users:view', 'users:edit'], {
      id: 'u1',
      role: { code: 'MANAGER', permissions: ['users:view', 'users:edit', 'orders:view'] },
    });
    expect(await guard.canActivate(makeCtx({ userId: 'u1' }))).toBe(true);
  });

  it('denies when any required permission missing', async () => {
    const guard = makeGuard(['users:view', 'users:delete'], {
      id: 'u1',
      role: { code: 'MANAGER', permissions: ['users:view'] },
    });
    expect(await guard.canActivate(makeCtx({ userId: 'u1' }))).toBe(false);
  });

  it('handles permissions=null defensively', async () => {
    const guard = makeGuard(['users:view'], {
      id: 'u1',
      role: { code: 'MANAGER', permissions: null },
    });
    expect(await guard.canActivate(makeCtx({ userId: 'u1' }))).toBe(false);
  });
});
