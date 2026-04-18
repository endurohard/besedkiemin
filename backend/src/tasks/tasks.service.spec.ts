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
});
