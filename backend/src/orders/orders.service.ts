import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, userId: string) {
    // Генерация номера заказа
    const lastOrder = await this.prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const orderNumber = lastOrder
      ? `ORD-${String(parseInt(lastOrder.orderNumber.split('-')[1]) + 1).padStart(3, '0')}`
      : 'ORD-001';

    return this.prisma.order.create({
      data: {
        ...createOrderDto,
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
      },
    });
  }

  async findAll(filters?: {
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.order.findMany({
      where,
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
                startedAt: 'desc',
              },
              take: 1, // Только последняя история
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
      },
      orderBy: { createdAt: 'desc' },
    });
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
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
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
    const orders = await this.findAll(filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Заказы');

    // Заголовки
    worksheet.columns = [
      { header: '№ Заказа', key: 'orderNumber', width: 15 },
      { header: 'Клиент', key: 'customerName', width: 25 },
      { header: 'Телефон', key: 'customerPhone', width: 20 },
      { header: 'Адрес', key: 'customerAddress', width: 35 },
      { header: 'Статус', key: 'status', width: 20 },
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
    orders.forEach((order) => {
      worksheet.addRow({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress || '-',
        status: this.translateStatus(order.status),
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
