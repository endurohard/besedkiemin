import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUsers = () => ({
  findByEmailWithRole: jest.fn(),
  findOne: jest.fn(),
  findByPin: jest.fn(),
});

const mockJwt = () => ({
  sign: jest.fn().mockReturnValue('signed.jwt.token'),
});

describe('AuthService', () => {
  let service: AuthService;
  let users: ReturnType<typeof mockUsers>;
  let jwt: ReturnType<typeof mockJwt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: mockUsers },
        { provide: JwtService, useFactory: mockJwt },
      ],
    }).compile();

    service = module.get(AuthService);
    users = module.get(UsersService);
    jwt = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('returns user without password on valid credentials', async () => {
      const hash = await bcrypt.hash('secret', 4);
      users.findByEmailWithRole.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        password: hash,
        firstName: 'A',
        lastName: 'B',
        role: { code: 'WORKER' },
      });

      const result = await service.validateUser('a@b.c', 'secret');

      expect(result).toMatchObject({ id: 'u1', email: 'a@b.c' });
      expect((result as any).password).toBeUndefined();
    });

    it('returns null on wrong password', async () => {
      const hash = await bcrypt.hash('secret', 4);
      users.findByEmailWithRole.mockResolvedValue({
        id: 'u1', email: 'a@b.c', password: hash, firstName: 'A', lastName: 'B', role: null,
      });

      const result = await service.validateUser('a@b.c', 'WRONG');

      expect(result).toBeNull();
    });

    it('returns null when user not found', async () => {
      users.findByEmailWithRole.mockResolvedValue(null);

      const result = await service.validateUser('nope@x', 'x');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('signs JWT with sub, email, role code', async () => {
      const out = await service.login({
        id: 'u1',
        email: 'a@b.c',
        firstName: 'A',
        lastName: 'B',
        role: { code: 'MANAGER' } as any,
      });

      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.c', role: 'MANAGER' });
      expect(out.access_token).toBe('signed.jwt.token');
      expect(out.user.role).toEqual({ code: 'MANAGER' });
    });

    it('does not leak sipPassword', async () => {
      const out = await service.login({
        id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B',
        role: null, sipPassword: 'TOP_SECRET', sipUser: 'ext100',
      });

      expect(JSON.stringify(out.user)).not.toContain('TOP_SECRET');
      expect(out.user).toHaveProperty('sipUser', 'ext100');
    });

    it('handles user without role (role code undefined in payload)', async () => {
      await service.login({
        id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B', role: null,
      });

      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.c', role: undefined });
    });
  });

  describe('validatePin', () => {
    it('delegates to usersService.findByPin', async () => {
      users.findByPin.mockResolvedValue({ id: 'u9' });
      const res = await service.validatePin('1234');
      expect(users.findByPin).toHaveBeenCalledWith('1234');
      expect(res).toEqual({ id: 'u9' });
    });
  });
});
