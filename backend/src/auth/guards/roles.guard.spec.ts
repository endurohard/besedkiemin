import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

const makeCtx = (user: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext);

const makeGuard = (requiredRoles: string[] | undefined) => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
};

describe('RolesGuard', () => {
  it('allows when no roles required', () => {
    expect(makeGuard(undefined).canActivate(makeCtx({ roleCode: 'ANY' }))).toBe(true);
    expect(makeGuard([]).canActivate(makeCtx({ roleCode: 'ANY' }))).toBe(true);
  });

  it('denies when user missing', () => {
    expect(makeGuard(['MANAGER']).canActivate(makeCtx(null))).toBe(false);
  });

  it('denies when user has no role', () => {
    expect(makeGuard(['MANAGER']).canActivate(makeCtx({ userId: 'u1' }))).toBe(false);
  });

  it('SUPER_ADMIN passes for any required role', () => {
    const guard = makeGuard(['WAREHOUSE', 'MANAGER']);
    expect(guard.canActivate(makeCtx({ userId: 'u1', roleCode: 'SUPER_ADMIN' }))).toBe(true);
  });

  it('OWNER passes for non-SUPER_ADMIN-only routes', () => {
    expect(
      makeGuard(['MANAGER']).canActivate(makeCtx({ userId: 'u1', roleCode: 'OWNER' }))
    ).toBe(true);
  });

  it('OWNER blocked from SUPER_ADMIN-only routes', () => {
    expect(
      makeGuard(['SUPER_ADMIN']).canActivate(makeCtx({ userId: 'u1', roleCode: 'OWNER' }))
    ).toBe(false);
  });

  it('OWNER passes when SUPER_ADMIN is one of several required', () => {
    // SUPER_ADMIN-only rule is length===1 + code===SUPER_ADMIN
    expect(
      makeGuard(['SUPER_ADMIN', 'MANAGER']).canActivate(
        makeCtx({ userId: 'u1', roleCode: 'OWNER' })
      )
    ).toBe(true);
  });

  it.each([
    ['MANAGER', ['MANAGER'], true],
    ['MANAGER', ['WAREHOUSE'], false],
    ['WAREHOUSE', ['WAREHOUSE', 'MANAGER'], true],
    ['PAINTER', ['WAREHOUSE'], false],
    ['PAINTER', ['PAINTER', 'SEWER'], true],
  ])('role %s against required %j → %s', (roleCode, required, expected) => {
    const guard = makeGuard(required as string[]);
    expect(guard.canActivate(makeCtx({ userId: 'u1', roleCode }))).toBe(expected);
  });
});
