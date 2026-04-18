import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { TelegramService } from '../../src/telegram/telegram.service';

let container: StartedPostgreSqlContainer | null = null;
let app: INestApplication | null = null;
let prisma: PrismaClient | null = null;

const APP_TABLES = [
  'work_logs', 'penalties', 'payroll_periods', 'manager_commissions', 'work_rates',
  'quality_checks', 'tasks', 'product_history', 'products',
  'shipment_items', 'shipments', 'inventory_items',
  'catalog_order_items', 'catalog_orders', 'catalog_products', 'catalog_categories',
  'chat_messages', 'chat_rooms',
  'orders', 'order_sources',
  'nomenclatures', 'product_types',
  'role_workflow_stages', 'workflow_stages',
  'feature_flags', 'company_settings', 'contact_requests',
  'users', 'roles',
];

export const telegramMock = {
  sendMessage: jest.fn(),
  sendPhoto: jest.fn(),
  sendPhotoMessage: jest.fn(),
  requestDefectPhoto: jest.fn().mockResolvedValue(true),
  sendPenaltyNotification: jest.fn(),
  sendDefectNotification: jest.fn(),
  notifyNewTask: jest.fn(),
  notifyTaskCreated: jest.fn(),
  notifyTaskCompleted: jest.fn(),
  notifyAdmins: jest.fn(),
  generateTelegramLink: jest.fn((id: string) => `https://t.me/mock?start=${id}`),
  generateLoginCode: jest.fn(() => '123456'),
  validateLoginCode: jest.fn(() => ({ valid: false })),
  removeLoginCode: jest.fn(),
  onModuleInit: jest.fn(),
};

export async function startTestApp(): Promise<{ app: INestApplication; prisma: PrismaClient }> {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('besedki_e2e')
    .withUsername('test')
    .withPassword('test')
    .withStartupTimeout(60000)
    .start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-only';
  process.env.TELEGRAM_BOT_TOKEN = ''; // keep Telegram bot disabled
  process.env.NODE_ENV = 'test';

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: url },
    cwd: path.resolve(__dirname, '..', '..'),
    stdio: 'pipe',
  });

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(TelegramService)
    .useValue(telegramMock)
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init();

  prisma = new PrismaClient({ datasources: { db: { url } } });
  await prisma.$connect();

  return { app, prisma };
}

export async function stopTestApp(): Promise<void> {
  await app?.close();
  app = null;
  await prisma?.$disconnect();
  prisma = null;
  await container?.stop();
  container = null;
}

export async function resetDb(client: PrismaClient): Promise<void> {
  const existing: { tablename: string }[] = await client.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  const names = new Set(existing.map((r) => r.tablename));
  const toTruncate = APP_TABLES.filter((t) => names.has(t));
  if (toTruncate.length === 0) return;
  await client.$executeRawUnsafe(
    `TRUNCATE TABLE ${toTruncate.map((n) => `"${n}"`).join(', ')} RESTART IDENTITY CASCADE`
  );
}

import * as bcrypt from 'bcrypt';

export async function makeUser(
  client: PrismaClient,
  opts: { email: string; password: string; firstName?: string; lastName?: string; roleCode: string; roleId?: string; isDept?: boolean }
) {
  let roleId = opts.roleId;
  if (!roleId) {
    const role = await client.role.upsert({
      where: { code: opts.roleCode },
      update: {},
      create: { name: opts.roleCode, code: opts.roleCode },
    });
    roleId = role.id;
  }
  const hash = await bcrypt.hash(opts.password, 4);
  return client.user.create({
    data: {
      email: opts.email,
      password: hash,
      firstName: opts.firstName || 'First',
      lastName: opts.lastName || 'Last',
      roleId,
      isDepartmentAccount: !!opts.isDept,
    },
  });
}
