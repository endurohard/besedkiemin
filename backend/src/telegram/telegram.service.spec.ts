import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeCodeService } from '../claude-code/claude-code.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let prisma: { user: { findUnique: jest.Mock; findFirst: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '';
        if (key === 'TELEGRAM_ADMIN_ID') return '';
        return undefined;
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: ClaudeCodeService, useValue: { handleCommand: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(TelegramService);
    await service.onModuleInit();
  });

  describe('bot not configured (empty token)', () => {
    it('onModuleInit does not throw and leaves bot undefined', () => {
      expect((service as any).bot).toBeUndefined();
    });

    it('sendMessage is a no-op when bot is undefined', async () => {
      await expect(service.sendMessage('123', 'hi')).resolves.toBeUndefined();
    });

    it('sendPhotoMessage is a no-op when bot is undefined', async () => {
      await expect(
        service.sendPhotoMessage('123', 'http://x/y.jpg', 'caption'),
      ).resolves.toBeUndefined();
    });

    it('sendPenaltyNotification short-circuits when user has no telegramId', async () => {
      prisma.user.findUnique.mockResolvedValue({ telegramId: null, firstName: 'A', lastName: 'B' });
      await expect(
        service.sendPenaltyNotification({
          userId: 'u1',
          amount: 500,
          reason: 'брак',
          createdByName: 'OWNER',
        }),
      ).resolves.toBeUndefined();
    });

    it('requestDefectPhoto returns false when user has no telegramId', async () => {
      prisma.user.findUnique.mockResolvedValue({ telegramId: null });
      const result = await service.requestDefectPhoto('u1', 't1', 'scratched', 2);
      expect(result).toBeFalsy();
    });

    it('requestDefectPhoto returns false on invalid (NaN) telegramId', async () => {
      prisma.user.findUnique.mockResolvedValue({ telegramId: 'not-a-number' });
      const result = await service.requestDefectPhoto('u1', 't1', 'scratched', 2);
      expect(result).toBeFalsy();
    });

    it('notifyNewTask returns silently when user has no telegramId', async () => {
      prisma.user.findUnique.mockResolvedValue({ telegramId: null });
      await expect(service.notifyNewTask('u1', 'Paint', 'ORD-001', 3)).resolves.toBeUndefined();
    });
  });

  describe('login code round-trip', () => {
    it('generates a 6-digit numeric code', () => {
      const code = service.generateLoginCode('user-123');
      expect(code).toMatch(/^\d{6}$/);
    });

    it('validateLoginCode returns the userId for a fresh code', () => {
      const code = service.generateLoginCode('user-123');
      const res = service.validateLoginCode(code);
      expect(res.valid).toBe(true);
      expect(res.userId).toBe('user-123');
    });

    it('validateLoginCode is false for unknown code', () => {
      expect(service.validateLoginCode('000000').valid).toBe(false);
    });

    it('validateLoginCode drops and rejects expired code', () => {
      const code = service.generateLoginCode('user-xyz');
      const store: Map<string, { userId: string; expiresAt: Date }> = (service as any).loginCodes;
      const entry = store.get(code)!;
      entry.expiresAt = new Date(Date.now() - 1000);
      const res = service.validateLoginCode(code);
      expect(res.valid).toBe(false);
      expect(store.has(code)).toBe(false);
    });

    it('removeLoginCode deletes the stored code', () => {
      const code = service.generateLoginCode('user-z');
      service.removeLoginCode(code);
      expect(service.validateLoginCode(code).valid).toBe(false);
    });
  });

  describe('generateTelegramLink', () => {
    it('builds a t.me start link containing the userId', () => {
      expect(service.generateTelegramLink('user-42')).toBe(
        'https://t.me/besedkiemin_bot?start=user-42',
      );
    });
  });
});
