import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

let container: StartedPostgreSqlContainer | null = null;
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

export async function startPostgres(): Promise<PrismaClient> {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('besedki_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;

  // Apply schema via prisma db push (faster than migrate deploy, no migration history needed for tests)
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: url },
    cwd: path.resolve(__dirname, '..', '..'),
    stdio: 'pipe',
  });

  prisma = new PrismaClient({ datasources: { db: { url } } });
  await prisma.$connect();
  return prisma;
}

export async function stopPostgres(): Promise<void> {
  await prisma?.$disconnect();
  prisma = null;
  await container?.stop();
  container = null;
}

export async function resetDb(client: PrismaClient): Promise<void> {
  // Truncate only tables that actually exist (prisma db push creates all, but be defensive)
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
