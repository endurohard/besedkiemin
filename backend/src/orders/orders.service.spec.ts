import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const mockPrisma = () => ({
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
});

const mockNotifications = () => ({
  sendToUser: jest.fn(),
  sendToRole: jest.fn(),
  broadcast: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: NotificationsGateway, useFactory: mockNotifications },
      ],
    }).compile();

    service = module.get(OrdersService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('auto-generates ORD-### number when not provided', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{ next_num: 42 }]);
      prisma.order.create.mockResolvedValue({ id: 'o1', orderNumber: 'ORD-042' });

      await service.create({ customerName: 'X', customerPhone: '+7' } as any, 'user-1');

      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
      const call = prisma.order.create.mock.calls[0][0];
      expect(call.data.orderNumber).toBe('ORD-042');
      expect(call.data.status).toBe(OrderStatus.NEW);
      expect(call.data.createdById).toBe('user-1');
    });

    it('starts numbering from 1 when no prior orders', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([{ next_num: 1 }]);
      prisma.order.create.mockResolvedValue({});

      await service.create({ customerName: 'X', customerPhone: '+7' } as any, 'u');

      expect(prisma.order.create.mock.calls[0][0].data.orderNumber).toBe('ORD-001');
    });

    it('uses provided orderNumber verbatim', async () => {
      prisma.order.create.mockResolvedValue({});

      await service.create(
        { orderNumber: 'CUSTOM-1', customerName: 'X', customerPhone: '+7' } as any,
        'u'
      );

      expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(prisma.order.create.mock.calls[0][0].data.orderNumber).toBe('CUSTOM-1');
    });
  });

  describe('findAll', () => {
    it('clamps page and limit, returns paginated meta', async () => {
      prisma.order.findMany.mockResolvedValue([{ id: 'o1' }]);
      prisma.order.count.mockResolvedValue(1);

      const res = await service.findAll({ page: 0, limit: 999999 });

      const call = prisma.order.findMany.mock.calls[0][0];
      expect(call.skip).toBe(0);
      expect(call.take).toBeLessThanOrEqual(1000);
      expect(res.meta.total).toBe(1);
      expect(res.meta.page).toBe(1);
    });

    it('passes status filter through', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll({ status: OrderStatus.COMPLETED });

      expect(prisma.order.findMany.mock.calls[0][0].where.status).toBe(OrderStatus.COMPLETED);
    });

    it('ignores invalid date strings', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll({ startDate: 'not-a-date' });

      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.createdAt?.gte).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('throws NotFound when missing', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });

    it('returns the order when found', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1' });
      await expect(service.findOne('o1')).resolves.toEqual({ id: 'o1' });
    });
  });

  describe('update / remove', () => {
    it('update throws if order missing', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.update('x', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('remove throws if order missing', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatistics', () => {
    it('aggregates per status', async () => {
      prisma.order.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // new
        .mockResolvedValueOnce(4)  // in production
        .mockResolvedValueOnce(2)  // completed
        .mockResolvedValueOnce(1); // cancelled

      const stats = await service.getStatistics();

      expect(stats).toEqual({ total: 10, new: 3, inProduction: 4, completed: 2, cancelled: 1 });
    });
  });
});
