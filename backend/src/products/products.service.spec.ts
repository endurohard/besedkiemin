import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, ProductionStage } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { InventoryService } from '../inventory/inventory.service';

const mockTelegram = () => ({
  sendMessage: jest.fn(),
  requestDefectPhoto: jest.fn(),
});

const mockInventory = () => ({
  consumeInventoryTx: jest.fn(),
});

const buildPrisma = () => ({
  order: { findUnique: jest.fn(), update: jest.fn() },
  workflowStage: { findFirst: jest.fn(), findMany: jest.fn() },
  user: { findMany: jest.fn() },
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  productHistory: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  task: { create: jest.fn() },
  $transaction: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof buildPrisma>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useFactory: buildPrisma },
        { provide: TelegramService, useFactory: mockTelegram },
        { provide: InventoryService, useFactory: mockInventory },
      ],
    }).compile();

    service = module.get(ProductsService);
    prisma = module.get(PrismaService);
    // $transaction runs the callback against the same mock prisma
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
  });

  describe('create', () => {
    it('throws NotFound when order missing', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ orderId: 'o-miss', name: 'x', quantity: 1 } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when no active workflow stage configured', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', orderNumber: 'ORD-001' });
      prisma.workflowStage.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ orderId: 'o1', name: 'x', quantity: 1 } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('creates product, tasks for workers, and flips order to IN_PRODUCTION', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', orderNumber: 'ORD-001' });
      prisma.workflowStage.findFirst.mockResolvedValue({
        id: 'ws-1',
        name: 'Design',
        legacyStage: ProductionStage.DESIGN,
        roles: [{ roleId: 'role-designer' }],
      });
      prisma.user.findMany.mockResolvedValue([
        { id: 'w1', email: 'w1@x', telegramId: null, role: { code: 'DESIGNER' } },
        { id: 'w2', email: 'w2@x', telegramId: null, role: { code: 'DESIGNER' } },
      ]);
      prisma.product.create.mockResolvedValue({
        id: 'p1', name: 'Стол', quantity: 2, productType: { name: 'Столы' },
      });

      await service.create({
        orderId: 'o1', name: 'Стол', productTypeId: 'pt-1', quantity: 2,
      } as any);

      expect(prisma.task.create).toHaveBeenCalledTimes(2);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { status: OrderStatus.IN_PRODUCTION },
      });
    });

    it('assigns only the targeted worker when assignedWorkerId is provided', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', orderNumber: 'ORD-001' });
      prisma.workflowStage.findFirst.mockResolvedValue({
        id: 'ws-1', name: 'Design', legacyStage: ProductionStage.DESIGN,
        roles: [{ roleId: 'role-designer' }],
      });
      prisma.user.findMany.mockResolvedValue([
        { id: 'w1', email: 'w1@x', telegramId: null, role: { code: 'DESIGNER' } },
        { id: 'w2', email: 'w2@x', telegramId: null, role: { code: 'DESIGNER' } },
      ]);
      prisma.product.create.mockResolvedValue({ id: 'p1', name: 'x', quantity: 1 });

      await service.create({
        orderId: 'o1', name: 'x', productTypeId: 'pt-1', quantity: 1, assignedWorkerId: 'w2',
      } as any);

      expect(prisma.task.create).toHaveBeenCalledTimes(1);
      expect(prisma.task.create.mock.calls[0][0].data.assignedToId).toBe('w2');
    });

    it('does not flip order to IN_PRODUCTION when no workers available', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', orderNumber: 'ORD-001' });
      prisma.workflowStage.findFirst.mockResolvedValue({
        id: 'ws-1', name: 'Design', legacyStage: ProductionStage.DESIGN, roles: [],
      });
      prisma.user.findMany.mockResolvedValue([]);
      prisma.product.create.mockResolvedValue({ id: 'p1', name: 'x', quantity: 1 });

      await service.create({
        orderId: 'o1', name: 'x', productTypeId: 'pt-1', quantity: 1,
      } as any);

      expect(prisma.task.create).not.toHaveBeenCalled();
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('moveToStage — validation', () => {
    const DESIGN = ProductionStage.DESIGN;
    const PREPARATION = ProductionStage.PREPARATION;
    const PAINTING = ProductionStage.PAINTING;
    const SEWING = ProductionStage.SEWING;
    const ASSEMBLY = ProductionStage.ASSEMBLY;
    const QUALITY_CHECK = ProductionStage.QUALITY_CHECK;

    const workflow = [
      { legacyStage: DESIGN, order: 1 },
      { legacyStage: PREPARATION, order: 2 },
      { legacyStage: PAINTING, order: 3 },
      { legacyStage: SEWING, order: 4 },
      { legacyStage: ASSEMBLY, order: 5 },
      { legacyStage: QUALITY_CHECK, order: 6 },
    ];

    const seedProduct = (stage: ProductionStage) => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1', orderId: 'o1', stage,
        order: {}, history: [], qualityChecks: [],
      });
      prisma.workflowStage.findMany.mockResolvedValue(workflow);
      prisma.productHistory.findFirst.mockResolvedValue(null);
      prisma.productHistory.create.mockResolvedValue({});
      prisma.product.update.mockResolvedValue({});
      prisma.product.findMany.mockResolvedValue([{ stage: DESIGN }]);
    };

    it('allows +1 forward', async () => {
      seedProduct(DESIGN);
      await expect(service.moveToStage('p1', PREPARATION, 'user')).resolves.toBeDefined();
    });

    it('allows +2 skip (SEWING skip case)', async () => {
      seedProduct(PAINTING);
      await expect(service.moveToStage('p1', ASSEMBLY, 'user')).resolves.toBeDefined();
    });

    it('rejects +3 jumps', async () => {
      seedProduct(DESIGN);
      await expect(service.moveToStage('p1', SEWING, 'user')).rejects.toThrow(BadRequestException);
    });

    it('allows any backward move', async () => {
      seedProduct(ASSEMBLY);
      await expect(service.moveToStage('p1', DESIGN, 'user')).resolves.toBeDefined();
    });

    it('blocks transitions away from COMPLETED', async () => {
      seedProduct(ProductionStage.COMPLETED);
      await expect(service.moveToStage('p1', DESIGN, 'user')).rejects.toThrow(BadRequestException);
    });

    it('from last workflow stage allows COMPLETED', async () => {
      seedProduct(QUALITY_CHECK);
      await expect(service.moveToStage('p1', ProductionStage.COMPLETED, 'user')).resolves.toBeDefined();
    });

    it('from last workflow stage allows REJECTED', async () => {
      seedProduct(QUALITY_CHECK);
      await expect(service.moveToStage('p1', ProductionStage.REJECTED, 'user')).resolves.toBeDefined();
    });

    it('REJECTED can return only to an active workflow stage', async () => {
      seedProduct(ProductionStage.REJECTED);
      await expect(service.moveToStage('p1', PAINTING, 'user')).resolves.toBeDefined();
    });

    it('PENDING → first workflow stage is allowed', async () => {
      seedProduct(ProductionStage.PENDING);
      await expect(service.moveToStage('p1', DESIGN, 'user')).resolves.toBeDefined();
    });
  });

  describe('moveToStage — side effects', () => {
    beforeEach(() => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1', orderId: 'o1', stage: ProductionStage.DESIGN,
        order: {}, history: [], qualityChecks: [],
      });
      prisma.workflowStage.findMany.mockResolvedValue([
        { legacyStage: ProductionStage.DESIGN, order: 1 },
        { legacyStage: ProductionStage.PREPARATION, order: 2 },
      ]);
      prisma.product.update.mockResolvedValue({});
    });

    it('closes the active history row before creating a new one', async () => {
      prisma.productHistory.findFirst.mockResolvedValue({ id: 'h1' });
      prisma.product.findMany.mockResolvedValue([{ stage: ProductionStage.PREPARATION }]);

      await service.moveToStage('p1', ProductionStage.PREPARATION, 'u1', 'ok');

      expect(prisma.productHistory.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'h1' } })
      );
      expect(prisma.productHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'p1',
            stage: ProductionStage.PREPARATION,
            userId: 'u1',
            notes: 'ok',
          }),
        })
      );
    });

    it('flips order to COMPLETED when every product is COMPLETED', async () => {
      prisma.productHistory.findFirst.mockResolvedValue(null);
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'p1', orderId: 'o1', stage: ProductionStage.QUALITY_CHECK,
        order: {}, history: [], qualityChecks: [],
      });
      prisma.workflowStage.findMany.mockResolvedValue([
        { legacyStage: ProductionStage.QUALITY_CHECK, order: 1 },
      ]);
      prisma.product.findMany.mockResolvedValue([{ stage: ProductionStage.COMPLETED }]);

      await service.moveToStage('p1', ProductionStage.COMPLETED, 'u1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { status: OrderStatus.COMPLETED },
      });
    });

    it('flips order back to NEW when all products are PENDING', async () => {
      prisma.productHistory.findFirst.mockResolvedValue(null);
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'p1', orderId: 'o1', stage: ProductionStage.DESIGN,
        order: {}, history: [], qualityChecks: [],
      });
      prisma.workflowStage.findMany.mockResolvedValue([
        { legacyStage: ProductionStage.DESIGN, order: 1 },
      ]);
      prisma.product.findMany.mockResolvedValue([{ stage: ProductionStage.PENDING }]);

      // Move backward DESIGN → PENDING is not generally allowed by the validator, so
      // test the updateOrderStatus branch by forcing product state after the move.
      prisma.product.findMany.mockResolvedValueOnce([{ stage: ProductionStage.PENDING }]);

      // Directly exercise the helper path via moveToStage: DESIGN → DESIGN is a no-op
      // rejected by validation; instead exercise update for all-PENDING state via another path.
      // We simulate allPending by setting product.findMany return and moving to DESIGN
      // (index 0, currentIndex -1 when stage=PENDING).
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'p1', orderId: 'o1', stage: ProductionStage.PENDING,
        order: {}, history: [], qualityChecks: [],
      });

      await service.moveToStage('p1', ProductionStage.DESIGN, 'u1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { status: OrderStatus.NEW },
      });
    });
  });
});
