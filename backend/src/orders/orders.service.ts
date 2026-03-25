import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { PAGINATION, ORDER } from '../common/constants';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string) {
    let orderNumber = createOrderDto.orderNumber?.trim();

    // Если номер заказа не передан - генерируем атомарно через SQL
    if (!orderNumber) {
      const result: [{ next_num: number }] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(
          MAX(CAST(SUBSTRING(order_number FROM $1) AS INTEGER)), 0
        ) + 1 AS next_num
        FROM orders
        WHERE order_number ~ $2`,
        'ORD-(\\d+)',
        '^ORD-\\d+$'
      );
      const nextNum = Number(result[0]?.next_num || 1);
      orderNumber = `ORD-${String(nextNum).padStart(3, '0')}`;
    }

    // Извлекаем orderNumber из DTO чтобы не дублировать
    const { orderNumber: _, ...restDto } = createOrderDto;

    return this.prisma.order.create({
      data: {
        ...restDto,
        orderNumber,
        status: OrderStatus.NEW,
        createdById: userId,
      },
      include: {
        products: {
          include: {
            history: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        source: true,
      },
    });
  }

  async findAll(filters?: {
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.OrderWhereInput = {};
    const page = Math.max(1, filters?.page || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_PAGE_SIZE, Math.max(1, filters?.limit || PAGINATION.DEFAULT_PAGE_SIZE));

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        const d = new Date(filters.startDate);
        if (!isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (filters.endDate) {
        const d = new Date(filters.endDate);
        if (!isNaN(d.getTime())) where.createdAt.lte = d;
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          customerAddress: true,
          status: true,
          priority: true,
          description: true,
          totalAmount: true,
          sourceId: true,
          source: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              icon: true,
            },
          },
          createdAt: true,
          updatedAt: true,
          products: {
            select: {
              id: true,
              name: true,
              stage: true,
              quantity: true,
              productType: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            history: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
              orderBy: {
                startedAt: 'asc',
              },
            },
            qualityChecks: {
              include: {
                checkedBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        source: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Заказ с ID ${id} не найден`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id); // Проверка существования

    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
      include: {
        products: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        source: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Проверка существования

    return this.prisma.order.delete({
      where: { id },
    });
  }

  // Статистика по заказам
  async getStatistics(filters?: {
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        const d = new Date(filters.startDate);
        if (!isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (filters.endDate) {
        const d = new Date(filters.endDate);
        if (!isNaN(d.getTime())) where.createdAt.lte = d;
      }
    }

    const [total, newOrders, inProduction, completed, cancelled] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.NEW } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.IN_PRODUCTION } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
    ]);

    return {
      total,
      new: newOrders,
      inProduction,
      completed,
      cancelled,
    };
  }

  // Экспорт в Excel
  async exportToExcel(
    res: Response,
    filters?: {
      status?: OrderStatus;
      startDate?: string;
      endDate?: string;
    }
  ) {
    // Для экспорта получаем все записи без пагинации
    const result = await this.findAll({ ...filters, limit: PAGINATION.EXPORT_MAX_SIZE });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Заказы');

    // Заголовки
    worksheet.columns = [
      { header: '№ Заказа', key: 'orderNumber', width: 15 },
      { header: 'Клиент', key: 'customerName', width: 25 },
      { header: 'Телефон', key: 'customerPhone', width: 20 },
      { header: 'Адрес', key: 'customerAddress', width: 35 },
      { header: 'Статус', key: 'status', width: 20 },
      { header: 'Источник', key: 'source', width: 15 },
      { header: 'Сумма', key: 'totalAmount', width: 15 },
      { header: 'Описание', key: 'description', width: 35 },
      { header: 'Кол-во продуктов', key: 'productCount', width: 20 },
      { header: 'Дата создания', key: 'createdAt', width: 20 },
    ];

    // Стиль заголовков
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Данные
    result.data.forEach((order: any) => {
      worksheet.addRow({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress || '-',
        status: this.translateStatus(order.status),
        source: order.source?.name || '-',
        totalAmount: order.totalAmount ? `${order.totalAmount.toLocaleString('ru-RU')} ₽` : '-',
        description: order.description || '-',
        productCount: order.products?.length || 0,
        createdAt: order.createdAt.toLocaleDateString('ru-RU'),
      });
    });

    // Отправка файла
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  private translateStatus(status: OrderStatus): string {
    const translations = {
      [OrderStatus.NEW]: 'Новый',
      [OrderStatus.IN_PRODUCTION]: 'В производстве',
      [OrderStatus.COMPLETED]: 'Завершен',
      [OrderStatus.CANCELLED]: 'Отменен',
    };
    return translations[status] || status;
  }
}
