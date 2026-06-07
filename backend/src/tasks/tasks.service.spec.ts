import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { PayrollService } from '../payroll/payroll.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskStatus, ProductionStage } from '@prisma/client';

// Minimal mock factories
const mockPrisma = () => ({
  user: { findUnique: jest.fn() },
  task: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  product: { update: jest.fn(), findMany: jest.fn() },
  qualityCheck: { create: jest.fn() },
  workLog: { findMany: jest.fn() },
  workflowStage: { findMany: jest.fn() },
  inventoryItem: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  order: { update: jest.fn() },
  $transaction: jest.fn((fn: any) => fn(mockPrisma())),
});

const mockTelegram = () => ({
  sendMessage: jest.fn(),
  requestDefectPhoto: jest.fn(),
});

const mockPayroll = () => ({
  createWorkLog: jest.fn(),
});

const mockNotifications = () => ({
  sendToUser: jest.fn(),
  sendToRole: jest.fn(),
  broadcast: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;
  let payroll: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: TelegramService, useFactory: mockTelegram },
        { provide: PayrollService, useFactory: mockPayroll },
        { provide: NotificationsGateway, useFactory: mockNotifications },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
    payroll = module.get<PayrollService>(PayrollService);
  });

  describe('approveTask', () => {
    const userId = 'warehouse-user-1';
    const taskId = 'task-1';

    const warehouseUser = {
      id: userId,
      email: 'warehouse@factory.com',
      isDepartmentAccount: true,
      role: { code: 'WAREHOUSE', name: 'Warehouse' },
    };

    const mockTask = {
      id: taskId,
      status: TaskStatus.NEW,
      stage: ProductionStage.QUALITY_CHECK,
      assignedToId: userId,
      productId: 'product-1',
      quantity: 5,
      product: {
        id: 'product-1',
        name: 'Беседка 3x3',
        productTypeId: 'pt-1',
        orderId: 'order-1',
        nomenclatureId: null,
        quantity: 5,
        productType: { id: 'pt-1', name: 'Беседка' },
        order: { id: 'order-1', orderNumber: 'ORD-001' },
      },
    };

    it('should reject non-warehouse users', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...warehouseUser,
        role: { code: 'PAINTER', name: 'Painter' },
      });

      await expect(service.approveTask(taskId, userId, 5))
        .rejects.toThrow(ForbiddenException);
    });

    it('should reject if task not found', async () => {
      prisma.user.findUnique.mockResolvedValue(warehouseUser);
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.approveTask(taskId, userId, 5))
        .rejects.toThrow(NotFoundException);
    });

    it('should reject if task status is ACCEPTED', async () => {
      prisma.user.findUnique.mockResolvedValue(warehouseUser);
      prisma.task.findUnique.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.ACCEPTED,
      });

      await expect(service.approveTask(taskId, userId, 5))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject if task is not at QUALITY_CHECK stage', async () => {
      prisma.user.findUnique.mockResolvedValue(warehouseUser);
      prisma.task.findUnique.mockResolvedValue({
        ...mockTask,
        stage: ProductionStage.PAINTING,
      });

      await expect(service.approveTask(taskId, userId, 5))
        .rejects.toThrow(BadRequestException);
    });

    it('should execute all operations inside a transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(warehouseUser);
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.workflowStage.findMany.mockResolvedValue([
        { id: 'ws-1', legacyStage: ProductionStage.PAINTING, isActive: true },
      ]);

      // Setup transaction mock to track calls
      const txMock = {
        task: {
          update: jest.fn().mockResolvedValue({ ...mockTask, status: TaskStatus.PASSED }),
          findMany: jest.fn().mockResolvedValue([]),
        },
        product: {
          update: jest.fn(),
          findMany: jest.fn().mockResolvedValue([{ stage: ProductionStage.COMPLETED }]),
        },
        qualityCheck: { create: jest.fn() },
        workLog: { findMany: jest.fn().mockResolvedValue([]) },
        inventoryItem: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        order: { update: jest.fn() },
      };

      prisma.$transaction.mockImplementation(async (fn: any) => fn(txMock));

      await service.approveTask(taskId, userId, 5);

      // Verify transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify task updated inside transaction
      expect(txMock.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: taskId },
          data: expect.objectContaining({ status: TaskStatus.PASSED }),
        }),
      );

      // Verify product updated to COMPLETED
      expect(txMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stage: ProductionStage.COMPLETED }),
        }),
      );

      // Verify quality check created
      expect(txMock.qualityCheck.create).toHaveBeenCalled();

      // Verify inventory created
      expect(txMock.inventoryItem.create).toHaveBeenCalled();
    });

    it('should create work logs for passed production tasks', async () => {
      prisma.user.findUnique.mockResolvedValue(warehouseUser);
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.workflowStage.findMany.mockResolvedValue([
        { id: 'ws-painting', legacyStage: ProductionStage.PAINTING, isActive: true },
      ]);

      const passedTask = {
        id: 'task-painting',
        assignedToId: 'worker-1',
        stage: ProductionStage.PAINTING,
        quantity: 5,
        passedAt: new Date(),
        notes: null,
      };

      const txMock = {
        task: {
          update: jest.fn().mockResolvedValue({ ...mockTask, status: TaskStatus.PASSED }),
          findMany: jest.fn().mockResolvedValue([passedTask]),
        },
        product: {
          update: jest.fn(),
          findMany: jest.fn().mockResolvedValue([{ stage: ProductionStage.COMPLETED }]),
        },
        qualityCheck: { create: jest.fn() },
        workLog: { findMany: jest.fn().mockResolvedValue([]) },
        inventoryItem: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        order: { update: jest.fn() },
      };

      prisma.$transaction.mockImplementation(async (fn: any) => fn(txMock));

      await service.approveTask(taskId, userId, 5);

      // Verify work log created via payroll service
      expect(payroll.createWorkLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'worker-1',
          productId: 'product-1',
          taskId: 'task-painting',
          stage: ProductionStage.PAINTING,
          workflowStageId: 'ws-painting',
        }),
      );
    });
  });

  describe('reassignTask', () => {
    const managerId = 'manager-1';
    const taskId = 'task-1';
    const currentWorkerId = 'worker-current';
    const newWorkerId = 'worker-new';

    const manager = {
      id: managerId,
      email: 'manager@x',
      role: { code: 'MANAGER', name: 'Manager' },
    };

    const task = {
      id: taskId,
      status: TaskStatus.ACCEPTED,
      stage: ProductionStage.PAINTING,
      productId: 'prod-1',
      assignedToId: currentWorkerId,
      isDefect: false,
      quantity: 3,
      assignedTo: { id: currentWorkerId, roleId: 'role-painter', role: { code: 'PAINTER' } },
      product: {
        id: 'prod-1',
        name: 'Беседка',
        order: { id: 'order-1', orderNumber: 'ORD-1' },
        productType: { name: 'Беседка' },
      },
    };

    const newWorker = {
      id: newWorkerId,
      email: 'new@x',
      isActive: true,
      roleId: 'role-painter',
      telegramId: null,
      role: { code: 'PAINTER', name: 'Painter' },
    };

    const setupTx = (overrides: Record<string, any> = {}, worker = newWorker) => {
      const currentTask = { ...task, ...overrides };
      const txMock = {
        task: {
          findUnique: jest.fn().mockResolvedValue(currentTask),
          update: jest.fn().mockResolvedValue({ ...currentTask, assignedToId: worker.id }),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        user: { findUnique: jest.fn().mockResolvedValue(worker) },
      };
      prisma.$transaction.mockImplementation(async (fn: any) => fn(txMock));
      return txMock;
    };

    it('forbids non-manager/owner roles', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...manager,
        role: { code: 'PAINTER', name: 'Painter' },
      });

      await expect(service.reassignTask(taskId, newWorkerId, managerId))
        .rejects.toThrow(ForbiddenException);
    });

    it('rejects reassign of COMPLETED tasks', async () => {
      prisma.user.findUnique.mockResolvedValue(manager);
      setupTx({ status: TaskStatus.COMPLETED });

      await expect(service.reassignTask(taskId, newWorkerId, managerId))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects reassign of defect tasks', async () => {
      prisma.user.findUnique.mockResolvedValue(manager);
      setupTx({ isDefect: true });

      await expect(service.reassignTask(taskId, newWorkerId, managerId))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects worker from different department', async () => {
      prisma.user.findUnique.mockResolvedValue(manager);
      setupTx({}, { ...newWorker, roleId: 'role-sewer' });

      await expect(service.reassignTask(taskId, newWorkerId, managerId))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects reassigning to the same worker', async () => {
      prisma.user.findUnique.mockResolvedValue(manager);
      setupTx({ assignedToId: newWorkerId });

      await expect(service.reassignTask(taskId, newWorkerId, managerId))
        .rejects.toThrow(BadRequestException);
    });

    it('updates assignedToId for ACCEPTED tasks without deleting copies', async () => {
      prisma.user.findUnique.mockResolvedValue(manager);
      const txMock = setupTx();

      await service.reassignTask(taskId, newWorkerId, managerId);

      expect(txMock.task.deleteMany).not.toHaveBeenCalled();
      expect(txMock.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: taskId },
          data: { assignedToId: newWorkerId },
        }),
      );
    });

    it('deletes NEW copies for other workers when reassigning NEW task', async () => {
      prisma.user.findUnique.mockResolvedValue(manager);
      const txMock = setupTx({ status: TaskStatus.NEW });

      await service.reassignTask(taskId, newWorkerId, managerId);

      expect(txMock.task.deleteMany).toHaveBeenCalledWith({
        where: {
          productId: 'prod-1',
          stage: ProductionStage.PAINTING,
          status: TaskStatus.NEW,
          id: { not: taskId },
        },
      });
    });
  });

  describe('passTask — частичная передача (сплит продукта)', () => {
    const userId = 'worker-1';
    const taskId = 'task-prep';

    const baseTask = {
      id: taskId,
      status: TaskStatus.COMPLETED,
      stage: ProductionStage.PREPARATION,
      assignedToId: userId,
      productId: 'product-1',
      quantity: 10,
      title: 'Беседка - Заготовка',
      description: 'Количество: 10 шт.',
      priority: 'NORMAL',
      acceptedAt: new Date(),
      workflowStageId: 'ws-prep',
      isDefect: false,
      product: {
        id: 'product-1',
        name: 'Беседка',
        description: null,
        quantity: 10,
        dimensions: null,
        schemaImageUrl: null,
        schemaImageUrls: [],
        deadline: null,
        productTypeId: 'pt-1',
        requiresSewing: false,
        color: null,
        upholsteryMaterial: null,
        isCustom: false,
        needsDesign: false,
        stageAssignments: null,
        orderId: 'order-1',
        nomenclatureId: null,
        productType: { id: 'pt-1', requiresSewing: false },
      },
      assignedTo: { id: userId, roleId: 'role-prep', role: { id: 'role-prep' } },
    };

    beforeEach(() => {
      prisma.task.findUnique.mockResolvedValue(baseTask);
      // currentWorkflowStage, затем nextWorkflowStage
      prisma.workflowStage.findFirst = jest
        .fn()
        .mockResolvedValueOnce({ id: 'ws-prep', legacyStage: ProductionStage.PREPARATION, order: 2 })
        .mockResolvedValueOnce({ id: 'ws-paint', legacyStage: ProductionStage.PAINTING, order: 3, roles: [] });
      // транзакция выполняется на том же mock-объекте prisma
      prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
      prisma.product.create = jest.fn().mockResolvedValue({ id: 'product-2' });
      prisma.product.update = jest.fn().mockResolvedValue({});
      prisma.task.update.mockResolvedValue({ id: taskId, status: TaskStatus.COMPLETED, quantity: 6 });
      prisma.task.create = jest.fn().mockResolvedValue({ id: 'task-new' });
      prisma.productHistory = { create: jest.fn() };
      // updateOrderStatus: производство уже идёт
      prisma.product.findMany.mockResolvedValue([{ stage: ProductionStage.PREPARATION }]);
      prisma.order.findUnique = jest
        .fn()
        .mockResolvedValue({ status: 'IN_PRODUCTION', productionStartedAt: new Date() });
      prisma.user.findMany = jest.fn().mockResolvedValue([]); // нет работников следующего этапа
    });

    it('выделяет переданное кол-во в новый продукт на следующем этапе', async () => {
      await service.passTask(taskId, userId, 4);

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 4,
            stage: ProductionStage.PAINTING,
            orderId: 'order-1',
            productTypeId: 'pt-1',
          }),
        }),
      );
    });

    it('оставляет остаток на исходном продукте и исходной задаче (COMPLETED)', async () => {
      await service.passTask(taskId, userId, 4);

      // оригинал уменьшен до 6
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'product-1' }, data: { quantity: 6 } }),
      );
      // исходная задача остаётся с остатком (не переводится в PASSED)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: taskId }, data: { quantity: 6 } }),
      );
    });

    it('создаёт PASSED-задачу стадии для клон-продукта (для оплаты при приёмке)', async () => {
      await service.passTask(taskId, userId, 4);

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'product-2',
            status: TaskStatus.PASSED,
            quantity: 4,
            stage: ProductionStage.PREPARATION,
          }),
        }),
      );
    });

    it('полная передача (без указания кол-ва) двигает весь продукт, без сплита', async () => {
      await service.passTask(taskId, userId);

      // продукт не клонируется
      expect(prisma.product.create).not.toHaveBeenCalled();
      // исходная задача переводится в PASSED
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: taskId },
          data: expect.objectContaining({ status: TaskStatus.PASSED }),
        }),
      );
      // продукт двигается на следующий этап
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: { stage: ProductionStage.PAINTING },
        }),
      );
    });
  });
});
