import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PayrollStatus, ProductionStage } from '@prisma/client';

const mockPrisma = () => ({
  workRate: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  workLog: {
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
  },
  penalty: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
  },
  payrollPeriod: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  managerCommission: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  $transaction: jest.fn((fn: any) => fn(mockPrisma())),
});

describe('PayrollService', () => {
  let service: PayrollService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        { provide: PrismaService, useFactory: mockPrisma },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findWorkRate', () => {
    const productTypeId = 'pt-1';
    const stage = ProductionStage.PAINTING;

    it('should find work rate by nomenclature first', async () => {
      const nomenclatureRate = {
        id: 'wr-1',
        productTypeId,
        stage,
        nomenclatureId: 'nom-1',
        pricePerUnit: 500,
      };

      prisma.workRate.findUnique.mockResolvedValue(nomenclatureRate);

      const result = await service.findWorkRate(productTypeId, stage, 'nom-1');

      expect(result).toEqual(nomenclatureRate);
      expect(prisma.workRate.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { nomenclatureId_stage: { nomenclatureId: 'nom-1', stage } },
        }),
      );
    });

    it('should fallback to product type rate if no nomenclature rate', async () => {
      const productTypeRate = {
        id: 'wr-2',
        productTypeId,
        stage,
        nomenclatureId: null,
        pricePerUnit: 300,
      };

      prisma.workRate.findUnique.mockResolvedValue(null);
      prisma.workRate.findFirst.mockResolvedValue(productTypeRate);

      const result = await service.findWorkRate(productTypeId, stage, 'nom-missing');

      expect(result).toEqual(productTypeRate);
      expect(prisma.workRate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productTypeId, stage, nomenclatureId: null },
        }),
      );
    });

    it('should search by product type only when no nomenclatureId provided', async () => {
      const rate = { id: 'wr-3', productTypeId, stage, pricePerUnit: 200 };
      prisma.workRate.findFirst.mockResolvedValue(rate);

      const result = await service.findWorkRate(productTypeId, stage);

      expect(result).toEqual(rate);
      expect(prisma.workRate.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('createWorkLog', () => {
    it('should create work log with correct price from work rate', async () => {
      const workRate = { id: 'wr-1', pricePerUnit: 250 };
      prisma.workRate.findFirst.mockResolvedValue(workRate);
      prisma.workLog.create.mockResolvedValue({
        id: 'wl-1',
        quantity: 3,
        pricePerUnit: 250,
        totalAmount: 750,
      });

      const result = await service.createWorkLog({
        userId: 'user-1',
        productId: 'prod-1',
        productTypeId: 'pt-1',
        stage: ProductionStage.PAINTING,
        quantity: 3,
        completedAt: new Date(),
      });

      expect(result.totalAmount).toBe(750);
      expect(prisma.workLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pricePerUnit: 250,
            totalAmount: 750,
          }),
        }),
      );
    });

    it('should use 0 price when no work rate found', async () => {
      prisma.workRate.findFirst.mockResolvedValue(null);
      prisma.workLog.create.mockResolvedValue({
        id: 'wl-2',
        quantity: 5,
        pricePerUnit: 0,
        totalAmount: 0,
      });

      await service.createWorkLog({
        userId: 'user-1',
        productId: 'prod-1',
        productTypeId: 'pt-1',
        stage: ProductionStage.ASSEMBLY,
        quantity: 5,
        completedAt: new Date(),
      });

      expect(prisma.workLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pricePerUnit: 0,
            totalAmount: 0,
          }),
        }),
      );
    });
  });

  describe('calculatePayrollForUser', () => {
    const userId = 'user-1';
    const periodStart = new Date('2024-01-01');
    const periodEnd = new Date('2024-01-31');

    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.calculatePayrollForUser(userId, periodStart, periodEnd),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if period already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        role: { code: 'PAINTER' },
      });
      prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.calculatePayrollForUser(userId, periodStart, periodEnd),
      ).rejects.toThrow(ConflictException);
    });

    it('should calculate payroll correctly for production worker', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        role: { code: 'PAINTER' },
      });
      prisma.payrollPeriod.findUnique.mockResolvedValue(null);

      prisma.workLog.findMany.mockResolvedValue([
        { id: 'wl-1', totalAmount: 500, userId },
        { id: 'wl-2', totalAmount: 300, userId },
      ]);

      prisma.penalty.findMany.mockResolvedValue([
        { id: 'p-1', amount: 100, userId },
      ]);

      prisma.managerCommission.findUnique.mockResolvedValue(null);
      prisma.managerCommission.findFirst.mockResolvedValue(null);

      const txMock = {
        payrollPeriod: {
          create: jest.fn().mockResolvedValue({ id: 'pp-1' }),
        },
        workLog: { updateMany: jest.fn() },
        penalty: { updateMany: jest.fn() },
      };
      prisma.$transaction.mockImplementation(async (fn: any) => fn(txMock));

      // Mock findPayrollPeriod for return value
      prisma.payrollPeriod.findUnique
        .mockResolvedValueOnce(null) // existence check
        .mockResolvedValue({
          id: 'pp-1',
          userId,
          workAmount: 800,
          penaltyAmount: 100,
          totalAmount: 700,
          status: PayrollStatus.DRAFT,
          user: { id: userId, firstName: 'Test', lastName: 'User', role: { code: 'PAINTER' } },
          workLogs: [],
          penalties: [],
        });

      const result = await service.calculatePayrollForUser(userId, periodStart, periodEnd);

      expect(txMock.payrollPeriod.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            workAmount: 800,
            penaltyAmount: 100,
            totalAmount: 700,
            status: PayrollStatus.DRAFT,
          }),
        }),
      );
    });
  });

  describe('getWorkerEarnings', () => {
    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getWorkerEarnings('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return earnings structure with today and period data', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        firstName: 'Иван',
        lastName: 'Маляр',
        role: { name: 'Маляр' },
      });

      const mockWorkLogs = [
        {
          id: 'wl-1',
          totalAmount: 500,
          stage: ProductionStage.PAINTING,
          quantity: 2,
          pricePerUnit: 250,
          completedAt: new Date(),
          product: { id: 'p-1', name: 'Беседка 3x3' },
          productType: { id: 'pt-1', name: 'Беседка' },
        },
      ];

      prisma.workLog.findMany
        .mockResolvedValueOnce(mockWorkLogs)  // period logs
        .mockResolvedValueOnce(mockWorkLogs); // today logs

      prisma.penalty.findMany
        .mockResolvedValueOnce([])  // period penalties
        .mockResolvedValueOnce([]); // today penalties

      const result = await service.getWorkerEarnings('user-1');

      expect(result.user.firstName).toBe('Иван');
      expect(result.today).toBeDefined();
      expect(result.period_totals).toBeDefined();
      expect(result.recentWorkLogs).toBeDefined();
      expect(result.today.earnings).toBe(500);
      expect(result.period_totals.earnings).toBe(500);
    });
  });

  describe('approvePayrollPeriod', () => {
    it('should only approve DRAFT periods', async () => {
      prisma.payrollPeriod.findUnique.mockResolvedValue({
        id: 'pp-1',
        status: PayrollStatus.APPROVED,
        user: { id: 'u-1' },
        workLogs: [],
        penalties: [],
      });

      await expect(
        service.approvePayrollPeriod('pp-1', 'owner-1'),
      ).rejects.toThrow('Можно утвердить только черновик');
    });
  });

  describe('markPayrollAsPaid', () => {
    it('should only pay APPROVED periods', async () => {
      prisma.payrollPeriod.findUnique.mockResolvedValue({
        id: 'pp-1',
        status: PayrollStatus.DRAFT,
        user: { id: 'u-1' },
        workLogs: [],
        penalties: [],
      });

      await expect(
        service.markPayrollAsPaid('pp-1', 'owner-1'),
      ).rejects.toThrow('Можно выплатить только утвержденный расчет');
    });
  });
});
