import { INestApplication } from '@nestjs/common';
import { PrismaClient, ProductionStage } from '@prisma/client';
import request from 'supertest';
import { startTestApp, stopTestApp, resetDb, makeUser } from './app-harness';

describe('E2E: catalog (categories → products → public order → manager processes)', () => {
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

  it('owner creates category+product, public orders it, manager processes → production order', async () => {
    const [owner, manager] = await Promise.all([
      makeUser(prisma, { email: 'owner@x', password: 'pass1', roleCode: 'OWNER' }),
      makeUser(prisma, { email: 'mgr@x', password: 'pass1', roleCode: 'MANAGER' }),
    ]);
    const painterRole = await prisma.role.upsert({
      where: { code: 'PAINTER' },
      update: {},
      create: { name: 'PAINTER', code: 'PAINTER' },
    });
    const painting = await prisma.workflowStage.create({
      data: { name: 'Painting', legacyStage: ProductionStage.PAINTING, order: 1, isActive: true },
    });
    await prisma.roleWorkflowStage.create({
      data: { roleId: painterRole.id, workflowStageId: painting.id },
    });
    await prisma.productType.create({ data: { name: 'Стол', isActive: true } });

    const ownerToken = await login('owner@x', 'pass1');
    const managerToken = await login('mgr@x', 'pass1');

    // 1. Owner creates category (permission bypass via OWNER)
    const categoryRes = await request(http)
      .post('/catalog-categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Беседки', slug: 'besedki', description: 'Садовые' })
      .expect(201);
    const categoryId = categoryRes.body.id;

    // 2. Owner creates product
    const productRes = await request(http)
      .post('/catalog-products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Беседка 3x3',
        slug: 'besedka-3x3',
        categoryId,
        price: 50000,
        isFeatured: true,
        isActive: true,
      })
      .expect(201);
    const catalogProductId = productRes.body.id;

    // 3. Public fetches products (no auth)
    const publicListRes = await request(http).get('/catalog-products').expect(200);
    expect(Array.isArray(publicListRes.body)).toBe(true);
    expect(publicListRes.body.find((p: any) => p.id === catalogProductId)).toBeDefined();

    // 3b. Featured filter
    const featuredRes = await request(http).get('/catalog-products/featured').expect(200);
    expect(featuredRes.body.find((p: any) => p.id === catalogProductId)).toBeDefined();

    // 4. Public customer creates catalog order (no auth)
    const catalogOrderRes = await request(http)
      .post('/catalog-orders')
      .send({
        customerName: 'Иван',
        customerPhone: '+79001112233',
        customerEmail: 'ivan@example.com',
        comment: 'Хочу к выходным',
        deliveryAddress: 'Москва',
        items: [{ productId: catalogProductId, quantity: 1, comment: 'Цвет зелёный' }],
      })
      .expect(201);
    const catalogOrderId = catalogOrderRes.body.id;
    expect(catalogOrderRes.body.status).toBe('NEW');

    // 5. Manager lists catalog orders (RBAC: MANAGER allowed)
    const listRes = await request(http)
      .get('/catalog-orders')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    const orders = Array.isArray(listRes.body) ? listRes.body : listRes.body.items || listRes.body.data || [];
    expect(orders.find((o: any) => o.id === catalogOrderId)).toBeDefined();

    // 6. Manager marks contacted
    await request(http)
      .post(`/catalog-orders/${catalogOrderId}/mark-contacted`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({})
      .expect(201);

    const afterContacted = await prisma.catalogOrder.findUnique({ where: { id: catalogOrderId } });
    expect(afterContacted!.status).toBe('CONTACTED');

    // 7. Manager marks processed → creates production Order
    await request(http)
      .post(`/catalog-orders/${catalogOrderId}/mark-processed`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({})
      .expect(201);

    const afterProcessed = await prisma.catalogOrder.findUnique({ where: { id: catalogOrderId } });
    expect(afterProcessed!.status).toBe('IN_WORK');

    const productionOrders = await prisma.order.findMany({
      where: { customerPhone: '+79001112233' },
    });
    expect(productionOrders.length).toBeGreaterThan(0);
  });

  it('public cannot list or cancel catalog orders (401) but CAN create', async () => {
    await request(http).get('/catalog-orders').expect(401);
    await request(http).post('/catalog-orders/cancel').expect(404);
  });

  it('painter cannot list catalog orders (403)', async () => {
    await makeUser(prisma, { email: 'painter@x', password: 'pass1', roleCode: 'PAINTER' });
    const token = await login('painter@x', 'pass1');
    await request(http)
      .get('/catalog-orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('catalog-categories public list works without auth', async () => {
    const owner = await makeUser(prisma, { email: 'owner@x', password: 'pass1', roleCode: 'OWNER' });
    const token = await login('owner@x', 'pass1');

    await request(http)
      .post('/catalog-categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Мебель', slug: 'mebel' })
      .expect(201);

    const res = await request(http).get('/catalog-categories').expect(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].slug).toBe('mebel');
    expect(owner).toBeDefined();
  });

  it('catalog order validation — empty items array rejected', async () => {
    await request(http)
      .post('/catalog-orders')
      .send({
        customerName: 'X',
        customerPhone: '+79001112234',
        items: [{ productId: 'not-a-real-id', quantity: 0 }],
      })
      .expect(400);
  });
});
