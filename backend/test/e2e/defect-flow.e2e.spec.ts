import { INestApplication } from '@nestjs/common';
import { PrismaClient, ProductionStage, TaskStatus } from '@prisma/client';
import request from 'supertest';
import { startTestApp, stopTestApp, resetDb, makeUser, telegramMock } from './app-harness';

describe('E2E: defect / rejection flow', () => {
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
    telegramMock.requestDefectPhoto.mockClear();
  });

  async function login(email: string, password: string): Promise<string> {
    const res = await request(http).post('/auth/login').send({ email, password }).expect(201);
    return res.body.access_token;
  }

  async function seed() {
    const [manager, painter, warehouse] = await Promise.all([
      makeUser(prisma, { email: 'mgr@x', password: 'pass1', roleCode: 'MANAGER' }),
      makeUser(prisma, { email: 'painter@x', password: 'pass1', roleCode: 'PAINTER' }),
      makeUser(prisma, { email: 'wh@x', password: 'pass1', roleCode: 'WAREHOUSE', isDept: true }),
    ]);

    const painterRole = await prisma.role.findUnique({ where: { code: 'PAINTER' } });
    const painting = await prisma.workflowStage.create({
      data: { name: 'Painting', legacyStage: ProductionStage.PAINTING, order: 1, isActive: true },
    });
    await prisma.roleWorkflowStage.create({
      data: { roleId: painterRole!.id, workflowStageId: painting.id },
    });
    await prisma.workflowStage.create({
      data: { name: 'QC', legacyStage: ProductionStage.QUALITY_CHECK, order: 2, isActive: true },
    });

    const productType = await prisma.productType.create({ data: { name: 'Стол' } });
    await prisma.workRate.create({
      data: { productTypeId: productType.id, stage: ProductionStage.PAINTING, pricePerUnit: 400 },
    });

    return { manager, painter, warehouse, productType };
  }

  async function driveToQC(
    managerToken: string,
    painterToken: string,
    warehouseToken: string,
    productTypeId: string,
    painterId: string,
    quantity = 2,
  ) {
    const orderRes = await request(http)
      .post('/orders')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ customerName: 'Клиент', customerPhone: '+79990000000', totalAmount: 10000 })
      .expect(201);
    const orderId = orderRes.body.id;

    const productRes = await request(http)
      .post('/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Стул', productTypeId, quantity, orderId, assignedWorkerId: painterId })
      .expect(201);
    const productId = productRes.body.id;

    const [painterTask] = await prisma.task.findMany({
      where: { productId, stage: ProductionStage.PAINTING },
    });

    await request(http)
      .post(`/tasks/${painterTask.id}/accept`)
      .set('Authorization', `Bearer ${painterToken}`)
      .send({})
      .expect(201);

    await request(http)
      .post(`/tasks/${painterTask.id}/complete`)
      .set('Authorization', `Bearer ${painterToken}`)
      .send({ notes: 'готово' })
      .expect(201);

    await request(http)
      .post(`/products/${productId}/move`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({ stage: ProductionStage.QUALITY_CHECK })
      .expect(201);

    await prisma.task.update({
      where: { id: painterTask.id },
      data: { status: TaskStatus.PASSED, passedAt: new Date() },
    });

    return { productId, orderId };
  }

  it('full rejection: task → REJECTED, product → PAINTING, qualityCheck row created', async () => {
    const { painter, warehouse, productType } = await seed();
    const managerToken = await login('mgr@x', 'pass1');
    const painterToken = await login('painter@x', 'pass1');
    const warehouseToken = await login('wh@x', 'pass1');

    const { productId } = await driveToQC(managerToken, painterToken, warehouseToken, productType.id, painter.id, 1);

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

    const rejectRes = await request(http)
      .post(`/tasks/${qcTask.id}/reject`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        notes: 'Скол на краске',
        quantity: 1,
        returnToStage: ProductionStage.PAINTING,
      })
      .expect(201);

    expect(rejectRes.body.status).toBe(TaskStatus.REJECTED);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product!.stage).toBe(ProductionStage.PAINTING);

    const qc = await prisma.qualityCheck.findMany({ where: { productId } });
    expect(qc).toHaveLength(1);
    expect(qc[0].status).toBe('REJECTED');
    expect(qc[0].notes).toBe('Скол на краске');
    expect(qc[0].checkedById).toBe(warehouse.id);
  });

  it('partial rejection creates a new defect product for the rejected qty only', async () => {
    const { painter, warehouse, productType } = await seed();
    const managerToken = await login('mgr@x', 'pass1');
    const painterToken = await login('painter@x', 'pass1');
    const warehouseToken = await login('wh@x', 'pass1');

    const { productId } = await driveToQC(managerToken, painterToken, warehouseToken, productType.id, painter.id, 3);

    const qcTask = await prisma.task.create({
      data: {
        title: 'QC',
        stage: ProductionStage.QUALITY_CHECK,
        productId,
        assignedToId: warehouse.id,
        quantity: 3,
        status: TaskStatus.NEW,
      },
    });

    await request(http)
      .post(`/tasks/${qcTask.id}/reject`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        notes: 'Один кривой',
        quantity: 1,
        returnToStage: ProductionStage.PAINTING,
      })
      .expect(201);

    const original = await prisma.product.findUnique({ where: { id: productId } });
    expect(original!.stage).toBe(ProductionStage.QUALITY_CHECK);
    expect(original!.quantity).toBe(3);

    const defectProduct = await prisma.product.findFirst({
      where: { name: { contains: 'БРАК 1' } },
    });
    expect(defectProduct).not.toBeNull();
    expect(defectProduct!.quantity).toBe(1);
    expect(defectProduct!.stage).toBe(ProductionStage.PAINTING);

    const qc = await prisma.qualityCheck.findMany({ where: { productId: defectProduct!.id } });
    expect(qc).toHaveLength(1);
    expect(qc[0].status).toBe('REJECTED');

    const taskAfter = await prisma.task.findUnique({ where: { id: qcTask.id } });
    expect(taskAfter!.quantityProcessed).toBe(1);
    expect(taskAfter!.status).not.toBe(TaskStatus.REJECTED);
  });

  it('non-warehouse user cannot reject (403)', async () => {
    const { painter, warehouse, productType } = await seed();
    const managerToken = await login('mgr@x', 'pass1');
    const painterToken = await login('painter@x', 'pass1');
    const warehouseToken = await login('wh@x', 'pass1');

    const { productId } = await driveToQC(managerToken, painterToken, warehouseToken, productType.id, painter.id, 1);

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

    await request(http)
      .post(`/tasks/${qcTask.id}/reject`)
      .set('Authorization', `Bearer ${painterToken}`)
      .send({ notes: 'fake', quantity: 1, returnToStage: ProductionStage.PAINTING })
      .expect(403);
  });

  it('rejection on a task that is not at QC stage is 400', async () => {
    const { painter, warehouse, productType } = await seed();
    const managerToken = await login('mgr@x', 'pass1');
    const warehouseToken = await login('wh@x', 'pass1');

    const orderRes = await request(http)
      .post('/orders')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ customerName: 'X', customerPhone: '+79990000001', totalAmount: 1000 })
      .expect(201);

    const productRes = await request(http)
      .post('/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Стул',
        productTypeId: productType.id,
        quantity: 1,
        orderId: orderRes.body.id,
        assignedWorkerId: painter.id,
      })
      .expect(201);

    const paintingTask = await prisma.task.findFirst({
      where: { productId: productRes.body.id, stage: ProductionStage.PAINTING },
    });

    await prisma.task.update({
      where: { id: paintingTask!.id },
      data: { assignedToId: warehouse.id },
    });

    await request(http)
      .post(`/tasks/${paintingTask!.id}/reject`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({ notes: 'noop', quantity: 1 })
      .expect(400);
  });
});
