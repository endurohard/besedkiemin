import {
  PrismaClient, PaymentType, ProductionStage, TaskStatus,
} from '@prisma/client';
import { TasksService } from '../../src/tasks/tasks.service';
import { PayrollService } from '../../src/payroll/payroll.service';
import { startPostgres, stopPostgres, resetDb } from './postgres-harness';

const noopTelegram: any = {
  sendMessage: jest.fn(),
  requestDefectPhoto: jest.fn(),
  sendPenaltyNotification: jest.fn(),
};

const noopNotifications: any = {
  sendToUser: jest.fn(),
  sendToRole: jest.fn(),
  broadcast: jest.fn(),
};

describe('TasksService (integration)', () => {
  let prisma: PrismaClient;
  let tasks: TasksService;
  let payroll: PayrollService;

  beforeAll(async () => {
    prisma = await startPostgres();
    payroll = new PayrollService(prisma as any, noopTelegram);
    tasks = new TasksService(prisma as any, noopTelegram, payroll, noopNotifications);
  }, 120000);

  afterAll(async () => {
    await stopPostgres();
  });

  beforeEach(async () => {
    await resetDb(prisma);
    jest.clearAllMocks();
  });

  async function seedOrderWithTask(stage: ProductionStage = ProductionStage.PAINTING) {
    const painterRole = await prisma.role.create({ data: { name: 'Painter', code: 'PAINTER' } });
    const warehouseRole = await prisma.role.create({ data: { name: 'Warehouse', code: 'WAREHOUSE' } });
    const managerRole = await prisma.role.create({ data: { name: 'Manager', code: 'MANAGER' } });

    const [painter1, painter2, warehouse, manager] = await Promise.all([
      prisma.user.create({ data: { email: 'p1@x', password: 'x', firstName: 'P', lastName: '1', roleId: painterRole.id, paymentType: PaymentType.PIECE_RATE } }),
      prisma.user.create({ data: { email: 'p2@x', password: 'x', firstName: 'P', lastName: '2', roleId: painterRole.id, paymentType: PaymentType.PIECE_RATE } }),
      prisma.user.create({ data: { email: 'wh@x', password: 'x', firstName: 'W', lastName: 'H', roleId: warehouseRole.id, isDepartmentAccount: true } }),
      prisma.user.create({ data: { email: 'mgr@x', password: 'x', firstName: 'M', lastName: 'G', roleId: managerRole.id } }),
    ]);

    const productType = await prisma.productType.create({ data: { name: 'Beseдka' } });
    const order = await prisma.order.create({
      data: { orderNumber: 'ORD-001', customerName: 'C', totalAmount: 0, createdById: manager.id },
    });
    const product = await prisma.product.create({
      data: {
        name: 'B 3x3', quantity: 5, productTypeId: productType.id, orderId: order.id, stage,
      },
    });
    const task = await prisma.task.create({
      data: {
        title: 'B 3x3 — Painting', stage, productId: product.id,
        assignedToId: painter1.id, quantity: 5,
      },
    });
    // a dup task given to p2 for same product+stage (simulates "broadcast to dept")
    const dupTask = await prisma.task.create({
      data: {
        title: 'B 3x3 — Painting', stage, productId: product.id,
        assignedToId: painter2.id, quantity: 5,
      },
    });

    return { painterRole, warehouseRole, painter1, painter2, warehouse, manager, productType, order, product, task, dupTask };
  }

  describe('acceptTask', () => {
    it('full accept removes duplicate tasks for the rest of the department', async () => {
      const { painter1, task, dupTask } = await seedOrderWithTask();

      await tasks.acceptTask(task.id, painter1.id);

      const remaining = await prisma.task.findMany();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(task.id);
      expect(remaining[0].status).toBe(TaskStatus.ACCEPTED);
      await expect(prisma.task.findUnique({ where: { id: dupTask.id } })).resolves.toBeNull();
    });

    it('partial accept creates residual tasks for every department worker', async () => {
      const { painter1, painter2, task } = await seedOrderWithTask();

      await tasks.acceptTask(task.id, painter1.id, undefined, 2);

      const all = await prisma.task.findMany({ orderBy: [{ status: 'asc' }, { quantity: 'asc' }] });
      const accepted = all.find((t) => t.status === TaskStatus.ACCEPTED);
      const residuals = all.filter((t) => t.status === TaskStatus.NEW);

      expect(accepted!.quantity).toBe(2);
      expect(residuals).toHaveLength(2);
      expect(residuals.every((r) => r.quantity === 3)).toBe(true);
      const assignees = new Set(residuals.map((r) => r.assignedToId));
      expect(assignees.has(painter1.id)).toBe(true);
      expect(assignees.has(painter2.id)).toBe(true);
    });

    it('rejects when worker is from a different department', async () => {
      const { task, warehouse } = await seedOrderWithTask();

      await expect(tasks.acceptTask(task.id, warehouse.id)).rejects.toThrow(/отдела|department/i);
    });

    it('rejects over-quantity', async () => {
      const { task, painter1 } = await seedOrderWithTask();

      await expect(
        tasks.acceptTask(task.id, painter1.id, undefined, 99)
      ).rejects.toThrow(/Нельзя принять/);
    });
  });

  describe('approveTask (warehouse)', () => {
    async function seedReadyForApproval() {
      const base = await seedOrderWithTask(ProductionStage.QUALITY_CHECK);
      // Create a preceding PASSED task on another stage so approveTask generates a WorkLog for it
      await prisma.task.create({
        data: {
          title: 'B 3x3 — Prep', stage: ProductionStage.PREPARATION,
          productId: base.product.id, assignedToId: base.painter1.id,
          quantity: 5, status: TaskStatus.PASSED,
          passedAt: new Date(),
        },
      });
      await prisma.workRate.create({
        data: {
          productTypeId: base.productType.id,
          stage: ProductionStage.PREPARATION,
          pricePerUnit: 100,
        },
      });
      return base;
    }

    it('refuses non-warehouse users', async () => {
      const { task, painter1 } = await seedReadyForApproval();
      await expect(tasks.approveTask(task.id, painter1.id, 5)).rejects.toThrow(/складист/i);
    });

    it('refuses if task is not on QUALITY_CHECK stage', async () => {
      const base = await seedOrderWithTask(ProductionStage.PAINTING);
      await expect(tasks.approveTask(base.task.id, base.warehouse.id, 1)).rejects.toThrow();
    });

    it('approves: task PASSED, product COMPLETED, workLog + inventoryItem created', async () => {
      const { task, product, warehouse, painter1 } = await seedReadyForApproval();

      await tasks.approveTask(task.id, warehouse.id, 5);

      const updatedTask = await prisma.task.findUnique({ where: { id: task.id } });
      expect(updatedTask!.status).toBe(TaskStatus.PASSED);

      const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updatedProduct!.stage).toBe(ProductionStage.COMPLETED);

      const workLogs = await prisma.workLog.findMany();
      expect(workLogs).toHaveLength(1);
      expect(workLogs[0].userId).toBe(painter1.id);
      expect(workLogs[0].stage).toBe(ProductionStage.PREPARATION);
      expect(workLogs[0].totalAmount).toBe(500);

      const inventory = await prisma.inventoryItem.findMany();
      expect(inventory).toHaveLength(1);
      expect(inventory[0].quantity).toBe(5);

      const qc = await prisma.qualityCheck.findMany();
      expect(qc).toHaveLength(1);
      expect(qc[0].status).toBe('APPROVED');
    });

    it('does not duplicate workLogs on retries (idempotent for the same task)', async () => {
      const { task, warehouse } = await seedReadyForApproval();

      await tasks.approveTask(task.id, warehouse.id, 5);

      // Re-trigger the logic path that checks existing logs: approve again after flipping back
      await prisma.task.update({ where: { id: task.id }, data: { status: TaskStatus.NEW } });
      await prisma.product.update({
        where: { id: (await prisma.task.findUnique({ where: { id: task.id } }))!.productId },
        data: { stage: ProductionStage.QUALITY_CHECK },
      });

      await tasks.approveTask(task.id, warehouse.id, 5);

      const workLogs = await prisma.workLog.findMany();
      expect(workLogs).toHaveLength(1);
    });
  });
});
