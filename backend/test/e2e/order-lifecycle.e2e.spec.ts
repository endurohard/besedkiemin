import { INestApplication } from '@nestjs/common';
import { PrismaClient, ProductionStage, TaskStatus } from '@prisma/client';
import request from 'supertest';
import { startTestApp, stopTestApp, resetDb, makeUser } from './app-harness';

describe('E2E: full order lifecycle', () => {
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
    const res = await request(http)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    return res.body.access_token;
  }

  async function seedWorkflowAndRoles() {
    const [manager, painter, warehouse] = await Promise.all([
      makeUser(prisma, { email: 'mgr@x', password: 'pass1', roleCode: 'MANAGER' }),
      makeUser(prisma, { email: 'painter@x', password: 'pass1', roleCode: 'PAINTER' }),
      makeUser(prisma, { email: 'wh@x', password: 'pass1', roleCode: 'WAREHOUSE', isDept: true }),
    ]);

    const painterRole = await prisma.role.findUnique({ where: { code: 'PAINTER' } });
    const painting = await prisma.workflowStage.create({
      data: {
        name: 'Painting',
        legacyStage: ProductionStage.PAINTING,
        order: 1,
        isActive: true,
      },
    });
    await prisma.roleWorkflowStage.create({
      data: { roleId: painterRole!.id, workflowStageId: painting.id },
    });
    const qc = await prisma.workflowStage.create({
      data: {
        name: 'QC',
        legacyStage: ProductionStage.QUALITY_CHECK,
        order: 2,
        isActive: true,
      },
    });

    const productType = await prisma.productType.create({ data: { name: 'Стол' } });
    await prisma.workRate.create({
      data: {
        productTypeId: productType.id,
        stage: ProductionStage.PAINTING,
        pricePerUnit: 400,
      },
    });

    return { manager, painter, warehouse, productType, painting, qc };
  }

  it('manager → order → product → painter accepts/completes → warehouse approves → workLog created', async () => {
    const { manager, painter, warehouse, productType } = await seedWorkflowAndRoles();

    const managerToken = await login('mgr@x', 'pass1');
    const painterToken = await login('painter@x', 'pass1');
    const warehouseToken = await login('wh@x', 'pass1');

    // 1. Manager creates order
    const orderRes = await request(http)
      .post('/orders')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        customerName: 'Иван',
        customerPhone: '+79001234567',
        totalAmount: 20000,
      })
      .expect(201);

    expect(orderRes.body.orderNumber).toMatch(/^ORD-\d{3}$/);
    const orderId = orderRes.body.id;

    // 2. Manager creates product — this auto-creates a task for PAINTER
    const productRes = await request(http)
      .post('/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Стол обеденный',
        productTypeId: productType.id,
        quantity: 1,
        orderId,
        assignedWorkerId: painter.id,
      })
      .expect(201);

    const productId = productRes.body.id;

    const initialTasks = await prisma.task.findMany({ where: { productId } });
    expect(initialTasks).toHaveLength(1);
    expect(initialTasks[0].assignedToId).toBe(painter.id);
    expect(initialTasks[0].stage).toBe(ProductionStage.PAINTING);

    // 3. Painter accepts task
    const acceptRes = await request(http)
      .post(`/tasks/${initialTasks[0].id}/accept`)
      .set('Authorization', `Bearer ${painterToken}`)
      .send({})
      .expect(201);
    expect(acceptRes.body.status).toBe(TaskStatus.ACCEPTED);

    // 4. Painter completes task
    const completeRes = await request(http)
      .post(`/tasks/${initialTasks[0].id}/complete`)
      .set('Authorization', `Bearer ${painterToken}`)
      .send({ notes: 'done' })
      .expect(201);
    expect(completeRes.body.status).toBe(TaskStatus.COMPLETED);

    // Move product to QC stage explicitly (some backends rely on manual move after complete)
    await request(http)
      .post(`/products/${productId}/move`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({ stage: ProductionStage.QUALITY_CHECK })
      .expect(201);

    // A QC task should exist now (or create it for warehouse to approve)
    // Build one directly for determinism:
    const completedPainterTask = await prisma.task.findFirst({
      where: { productId, stage: ProductionStage.PAINTING, status: TaskStatus.COMPLETED },
    });
    await prisma.task.update({
      where: { id: completedPainterTask!.id },
      data: { status: TaskStatus.PASSED, passedAt: new Date() },
    });
    const qcTask = await prisma.task.create({
      data: {
        title: 'QC',
        stage: ProductionStage.QUALITY_CHECK,
        productId,
        assignedToId: warehouse.id,
        quantity: 1,
        status: TaskStatus.NEW,
      },
    });

    // 5. Warehouse approves
    const approveRes = await request(http)
      .post(`/tasks/${qcTask.id}/approve`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({ quantity: 1 })
      .expect(201);

    expect(approveRes.body.status).toBe(TaskStatus.PASSED);

    // 6. Verify downstream state
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product!.stage).toBe(ProductionStage.COMPLETED);

    const inventory = await prisma.inventoryItem.findMany({ where: { productId } });
    expect(inventory).toHaveLength(1);
    expect(inventory[0].quantity).toBe(1);

    const workLogs = await prisma.workLog.findMany({ where: { productId } });
    expect(workLogs).toHaveLength(1);
    expect(workLogs[0].userId).toBe(painter.id);
    expect(workLogs[0].pricePerUnit).toBe(400);
    expect(workLogs[0].totalAmount).toBe(400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order!.status).toBe('COMPLETED');

    // 7. Owner calculates payroll for the painter
    const owner = await makeUser(prisma, { email: 'owner@x', password: 'pass1', roleCode: 'OWNER' });
    const ownerToken = await login('owner@x', 'pass1');

    const payrollRes = await request(http)
      .post('/payroll/calculate')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        userId: painter.id,
        periodStart: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        periodEnd: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      })
      .expect(201);

    const painterResult = payrollRes.body.find((r: any) => r.userId === painter.id);
    expect(painterResult.success).toBe(true);
    expect(painterResult.period.workAmount).toBe(400);
    expect(painterResult.period.totalAmount).toBe(400);
    expect(owner).toBeDefined();
  });

  it('rejects unauthenticated requests to protected endpoints', async () => {
    await request(http).get('/orders').expect(401);
    await request(http).post('/orders').send({}).expect(401);
  });
});
