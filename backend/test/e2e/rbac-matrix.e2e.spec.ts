import { INestApplication } from '@nestjs/common';
import { PrismaClient, ProductionStage } from '@prisma/client';
import request from 'supertest';
import { startTestApp, stopTestApp, resetDb, makeUser } from './app-harness';

describe('E2E: RBAC matrix', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let http: any;

  beforeAll(async () => {
    const boot = await startTestApp();
    app = boot.app;
    prisma = boot.prisma;
    http = app.getHttpServer();
  }, 180000);

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  async function login(email: string, password: string): Promise<string> {
    const res = await request(http).post('/auth/login').send({ email, password }).expect(201);
    return res.body.access_token;
  }

  async function seedRoles() {
    const [superAdmin, owner, manager, painter] = await Promise.all([
      makeUser(prisma, { email: 'sa@x', password: 'pass1', roleCode: 'SUPER_ADMIN' }),
      makeUser(prisma, { email: 'owner@x', password: 'pass1', roleCode: 'OWNER' }),
      makeUser(prisma, { email: 'mgr@x', password: 'pass1', roleCode: 'MANAGER' }),
      makeUser(prisma, { email: 'painter@x', password: 'pass1', roleCode: 'PAINTER' }),
    ]);
    const productType = await prisma.productType.create({ data: { name: 'Стол' } });
    await prisma.workflowStage.create({
      data: { name: 'Painting', legacyStage: ProductionStage.PAINTING, order: 1, isActive: true },
    });
    return { superAdmin, owner, manager, painter, productType };
  }

  describe('unauthenticated → 401', () => {
    it('GET /orders → 401', () => request(http).get('/orders').expect(401));
    it('POST /orders → 401', () => request(http).post('/orders').send({}).expect(401));
    it('POST /products → 401', () => request(http).post('/products').send({}).expect(401));
    it('GET /feature-flags → 401', () => request(http).get('/feature-flags').expect(401));
    it('POST /payroll/calculate → 401', () =>
      request(http).post('/payroll/calculate').send({}).expect(401));
    it('GET /feature-flags/public → 200 (public endpoint)', async () => {
      await seedRoles();
      await request(http).get('/feature-flags/public').expect(200);
    });
  });

  describe('POST /products (@Roles MANAGER)', () => {
    it('MANAGER → 201', async () => {
      const { productType } = await seedRoles();
      const token = await login('mgr@x', 'pass1');
      const order = await request(http)
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerName: 'x', customerPhone: '+79990000001', totalAmount: 1000 })
        .expect(201);
      await request(http)
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Стол', productTypeId: productType.id, quantity: 1, orderId: order.body.id })
        .expect(201);
    });

    it('SUPER_ADMIN bypasses role guard → 201', async () => {
      const { productType } = await seedRoles();
      const mgrToken = await login('mgr@x', 'pass1');
      const saToken = await login('sa@x', 'pass1');
      const order = await request(http)
        .post('/orders')
        .set('Authorization', `Bearer ${mgrToken}`)
        .send({ customerName: 'x', customerPhone: '+79990000002', totalAmount: 1000 })
        .expect(201);
      await request(http)
        .post('/products')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ name: 'Стол', productTypeId: productType.id, quantity: 1, orderId: order.body.id })
        .expect(201);
    });

    it('OWNER bypasses role guard → 201', async () => {
      const { productType } = await seedRoles();
      const mgrToken = await login('mgr@x', 'pass1');
      const ownerToken = await login('owner@x', 'pass1');
      const order = await request(http)
        .post('/orders')
        .set('Authorization', `Bearer ${mgrToken}`)
        .send({ customerName: 'x', customerPhone: '+79990000003', totalAmount: 1000 })
        .expect(201);
      await request(http)
        .post('/products')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Стол', productTypeId: productType.id, quantity: 1, orderId: order.body.id })
        .expect(201);
    });

    it('PAINTER → 403', async () => {
      const { productType } = await seedRoles();
      const mgrToken = await login('mgr@x', 'pass1');
      const painterToken = await login('painter@x', 'pass1');
      const order = await request(http)
        .post('/orders')
        .set('Authorization', `Bearer ${mgrToken}`)
        .send({ customerName: 'x', customerPhone: '+79990000004', totalAmount: 1000 })
        .expect(201);
      await request(http)
        .post('/products')
        .set('Authorization', `Bearer ${painterToken}`)
        .send({ name: 'Стол', productTypeId: productType.id, quantity: 1, orderId: order.body.id })
        .expect(403);
    });
  });

  describe('GET /feature-flags (@Roles SUPER_ADMIN only)', () => {
    it('SUPER_ADMIN → 200', async () => {
      await seedRoles();
      const token = await login('sa@x', 'pass1');
      await request(http).get('/feature-flags').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('OWNER → 403 (OWNER bypass does NOT include SUPER_ADMIN-only routes)', async () => {
      await seedRoles();
      const token = await login('owner@x', 'pass1');
      await request(http).get('/feature-flags').set('Authorization', `Bearer ${token}`).expect(403);
    });

    it('MANAGER → 403', async () => {
      await seedRoles();
      const token = await login('mgr@x', 'pass1');
      await request(http).get('/feature-flags').set('Authorization', `Bearer ${token}`).expect(403);
    });

    it('PAINTER → 403', async () => {
      await seedRoles();
      const token = await login('painter@x', 'pass1');
      await request(http).get('/feature-flags').set('Authorization', `Bearer ${token}`).expect(403);
    });
  });

  describe('POST /payroll/calculate (@Roles SUPER_ADMIN, OWNER)', () => {
    it('OWNER → 201', async () => {
      const { painter } = await seedRoles();
      const token = await login('owner@x', 'pass1');
      await request(http)
        .post('/payroll/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: painter.id,
          periodStart: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          periodEnd: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        })
        .expect(201);
    });

    it('SUPER_ADMIN → 201', async () => {
      const { painter } = await seedRoles();
      const token = await login('sa@x', 'pass1');
      await request(http)
        .post('/payroll/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: painter.id,
          periodStart: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          periodEnd: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        })
        .expect(201);
    });

    it('MANAGER → 403', async () => {
      const { painter } = await seedRoles();
      const token = await login('mgr@x', 'pass1');
      await request(http)
        .post('/payroll/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: painter.id,
          periodStart: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          periodEnd: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        })
        .expect(403);
    });

    it('PAINTER → 403', async () => {
      const { painter } = await seedRoles();
      const token = await login('painter@x', 'pass1');
      await request(http)
        .post('/payroll/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: painter.id,
          periodStart: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          periodEnd: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        })
        .expect(403);
    });
  });

  it('invalid token → 401', async () => {
    await request(http)
      .get('/orders')
      .set('Authorization', 'Bearer not.a.real.token')
      .expect(401);
  });
});
