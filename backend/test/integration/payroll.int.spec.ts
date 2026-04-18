import { PrismaClient, PaymentType, ProductionStage, PayrollStatus } from '@prisma/client';
import { PayrollService } from '../../src/payroll/payroll.service';
import { startPostgres, stopPostgres, resetDb } from './postgres-harness';

const mockTelegram: any = {
  sendMessage: jest.fn(),
  sendPenaltyNotification: jest.fn(),
  requestDefectPhoto: jest.fn(),
};

describe('PayrollService (integration)', () => {
  let prisma: PrismaClient;
  let service: PayrollService;

  beforeAll(async () => {
    prisma = await startPostgres();
    service = new PayrollService(prisma as any, mockTelegram);
  }, 120000);

  afterAll(async () => {
    await stopPostgres();
  });

  beforeEach(async () => {
    await resetDb(prisma);
    jest.clearAllMocks();
  });

  async function seedBase() {
    const role = await prisma.role.create({
      data: { name: 'Painter', code: 'PAINTER' },
    });
    const worker = await prisma.user.create({
      data: {
        email: 'painter@test', password: 'x',
        firstName: 'P', lastName: 'W',
        roleId: role.id, paymentType: PaymentType.PIECE_RATE,
      },
    });
    const manager = await prisma.user.create({
      data: {
        email: 'mgr@test', password: 'x',
        firstName: 'M', lastName: 'G',
        roleId: role.id,
      },
    });
    const productType = await prisma.productType.create({
      data: { name: 'Table' },
    });
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        customerName: 'Client',
        totalAmount: 10000,
        createdById: manager.id,
      },
    });
    const product = await prisma.product.create({
      data: {
        name: 'Table #1',
        quantity: 1,
        productTypeId: productType.id,
        orderId: order.id,
      },
    });
    return { role, worker, manager, productType, order, product };
  }

  describe('createWorkLog', () => {
    it('resolves rate by productType when no nomenclature set', async () => {
      const { worker, productType, product } = await seedBase();

      await prisma.workRate.create({
        data: {
          productTypeId: productType.id,
          stage: ProductionStage.PAINTING,
          pricePerUnit: 300,
        },
      });

      const log = await service.createWorkLog({
        userId: worker.id,
        productId: product.id,
        productTypeId: productType.id,
        stage: ProductionStage.PAINTING,
        quantity: 2,
        completedAt: new Date(),
      });

      expect(log.pricePerUnit).toBe(300);
      expect(log.totalAmount).toBe(600);
    });

    it('prefers nomenclature-specific rate over productType rate', async () => {
      const { worker, productType, product } = await seedBase();
      const nomenclature = await prisma.nomenclature.create({
        data: { name: 'Table 120x80', productTypeId: productType.id },
      });

      await prisma.workRate.create({
        data: { productTypeId: productType.id, stage: ProductionStage.PAINTING, pricePerUnit: 300 },
      });
      await prisma.workRate.create({
        data: {
          productTypeId: productType.id,
          nomenclatureId: nomenclature.id,
          stage: ProductionStage.PAINTING,
          pricePerUnit: 500,
        },
      });

      const log = await service.createWorkLog({
        userId: worker.id,
        productId: product.id,
        productTypeId: productType.id,
        nomenclatureId: nomenclature.id,
        stage: ProductionStage.PAINTING,
        quantity: 1,
        completedAt: new Date(),
      });

      expect(log.pricePerUnit).toBe(500);
    });

    it('falls back to 0 when no rate exists', async () => {
      const { worker, productType, product } = await seedBase();

      const log = await service.createWorkLog({
        userId: worker.id,
        productId: product.id,
        productTypeId: productType.id,
        stage: ProductionStage.PAINTING,
        quantity: 3,
        completedAt: new Date(),
      });

      expect(log.pricePerUnit).toBe(0);
      expect(log.totalAmount).toBe(0);
    });

    it('zeroes the price for SALARY workers', async () => {
      const { worker, productType, product } = await seedBase();
      await prisma.user.update({
        where: { id: worker.id },
        data: { paymentType: PaymentType.SALARY, monthlySalary: 50000 },
      });
      await prisma.workRate.create({
        data: { productTypeId: productType.id, stage: ProductionStage.PAINTING, pricePerUnit: 300 },
      });

      const log = await service.createWorkLog({
        userId: worker.id,
        productId: product.id,
        productTypeId: productType.id,
        stage: ProductionStage.PAINTING,
        quantity: 5,
        completedAt: new Date(),
      });

      expect(log.pricePerUnit).toBe(0);
      expect(log.totalAmount).toBe(0);
    });

    it('drops mismatched nomenclature (guard against cross-type linkage)', async () => {
      const { worker, productType, product } = await seedBase();
      const otherType = await prisma.productType.create({ data: { name: 'Chair' } });
      const foreignNomenclature = await prisma.nomenclature.create({
        data: { name: 'Chair X', productTypeId: otherType.id },
      });

      await prisma.workRate.create({
        data: { productTypeId: productType.id, stage: ProductionStage.PAINTING, pricePerUnit: 300 },
      });

      const log = await service.createWorkLog({
        userId: worker.id,
        productId: product.id,
        productTypeId: productType.id,
        nomenclatureId: foreignNomenclature.id,
        stage: ProductionStage.PAINTING,
        quantity: 1,
        completedAt: new Date(),
      });

      expect(log.pricePerUnit).toBe(300);
    });
  });

  describe('calculatePayrollForUser', () => {
    const periodStart = new Date('2026-01-01T00:00:00Z');
    const periodEnd = new Date('2026-01-31T23:59:59Z');

    it('aggregates work logs and penalties into PayrollPeriod', async () => {
      const { worker, manager, productType, product } = await seedBase();

      await service.createWorkLog({
        userId: worker.id, productId: product.id, productTypeId: productType.id,
        stage: ProductionStage.PAINTING, quantity: 2, completedAt: new Date('2026-01-15'),
      });

      // seed: one rate to give the log non-zero totalAmount
      await prisma.workRate.create({
        data: { productTypeId: productType.id, stage: ProductionStage.PAINTING, pricePerUnit: 250 },
      });
      // a second log that should pick up the rate
      await service.createWorkLog({
        userId: worker.id, productId: product.id, productTypeId: productType.id,
        stage: ProductionStage.PAINTING, quantity: 4, completedAt: new Date('2026-01-20'),
      });

      await prisma.penalty.create({
        data: {
          userId: worker.id,
          amount: 150,
          reason: 'brak',
          createdById: manager.id,
          date: new Date('2026-01-10'),
        },
      });

      const period = await service.calculatePayrollForUser(worker.id, periodStart, periodEnd);

      // workAmount = 0 (first log before rate) + 4*250 = 1000
      expect(period!.workAmount).toBe(1000);
      expect(period!.penaltyAmount).toBe(150);
      expect(period!.totalAmount).toBe(1000 - 150);
      expect(period!.status).toBe(PayrollStatus.DRAFT);

      // Work logs + penalty are attached to the period
      const logs = await prisma.workLog.findMany({ where: { userId: worker.id } });
      expect(logs.every((l) => l.payrollPeriodId === period!.id)).toBe(true);

      const penalty = await prisma.penalty.findFirst({ where: { userId: worker.id } });
      expect(penalty!.payrollPeriodId).toBe(period!.id);
    });

    it('throws ConflictException on duplicate period', async () => {
      const { worker } = await seedBase();

      await service.calculatePayrollForUser(worker.id, periodStart, periodEnd);

      await expect(
        service.calculatePayrollForUser(worker.id, periodStart, periodEnd)
      ).rejects.toThrow(/уже существует/);
    });

    it('floors total at zero when penalties exceed earnings', async () => {
      const { worker, manager } = await seedBase();

      await prisma.penalty.create({
        data: {
          userId: worker.id, amount: 9999, reason: 'huge',
          createdById: manager.id, date: new Date('2026-01-10'),
        },
      });

      const period = await service.calculatePayrollForUser(worker.id, periodStart, periodEnd);

      expect(period!.totalAmount).toBe(0);
      expect(period!.penaltyAmount).toBe(9999);
    });

    it('ignores cancelled penalties', async () => {
      const { worker, manager } = await seedBase();

      const p = await prisma.penalty.create({
        data: {
          userId: worker.id, amount: 500, reason: 'x',
          createdById: manager.id, date: new Date('2026-01-10'),
        },
      });
      await prisma.penalty.update({
        where: { id: p.id },
        data: { isCancelled: true, cancelledAt: new Date() },
      });

      const period = await service.calculatePayrollForUser(worker.id, periodStart, periodEnd);

      expect(period!.penaltyAmount).toBe(0);
    });
  });

  describe('cancelPenalty', () => {
    it('refuses to cancel a penalty from a PAID period', async () => {
      const { worker, manager } = await seedBase();
      const penalty = await prisma.penalty.create({
        data: {
          userId: worker.id, amount: 500, reason: 'x',
          createdById: manager.id, date: new Date('2026-02-01'),
        },
      });
      const period = await prisma.payrollPeriod.create({
        data: {
          userId: worker.id,
          periodStart: new Date('2026-02-01'),
          periodEnd: new Date('2026-02-28'),
          workAmount: 0, penaltyAmount: 500, totalAmount: 0,
          status: PayrollStatus.PAID,
        },
      });
      await prisma.penalty.update({
        where: { id: penalty.id },
        data: { payrollPeriodId: period.id },
      });

      await expect(service.cancelPenalty(penalty.id, manager.id)).rejects.toThrow(
        /выплаченный расчёт/
      );
    });

    it('cancels a penalty from a DRAFT period', async () => {
      const { worker, manager } = await seedBase();
      const penalty = await prisma.penalty.create({
        data: {
          userId: worker.id, amount: 500, reason: 'x',
          createdById: manager.id, date: new Date('2026-02-01'),
        },
      });

      const cancelled = await service.cancelPenalty(penalty.id, manager.id, 'oops');

      expect(cancelled.isCancelled).toBe(true);
      expect(cancelled.cancelledById).toBe(manager.id);
    });
  });
});
