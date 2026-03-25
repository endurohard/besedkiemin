import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentStatus } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  // Создать отгрузку (списание со склада)
  async createShipment(
    userId: string,
    data: {
      items: Array<{
        inventoryItemId: string;
        quantity: number;
      }>;
      customerName: string;
      customerPhone: string;
      deliveryAddress: string;
      deliveryDate?: Date;
      notes?: string;
      orderNumber?: string;
    }
  ) {
    // Проверяем права пользователя
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || (user.role?.code !== 'WAREHOUSE' && user.role?.code !== 'OWNER' && user.role?.code !== 'MANAGER')) {
      throw new ForbiddenException('Только складист, менеджер и владелец могут создавать отгрузки');
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Необходимо указать хотя бы один товар для отгрузки');
    }

    // Проверяем наличие всех товаров на складе
    const inventoryItemIds = data.items.map(item => item.inventoryItemId);
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: inventoryItemIds } },
      include: {
        product: true,
        productType: true,
      },
    });

    if (inventoryItems.length !== data.items.length) {
      throw new NotFoundException('Один или несколько товаров не найдены на складе');
    }

    // Проверяем достаточность количества для каждого товара
    for (const itemData of data.items) {
      const inventoryItem = inventoryItems.find(i => i.id === itemData.inventoryItemId);
      if (!inventoryItem) {
        throw new NotFoundException(`Товар с ID ${itemData.inventoryItemId} не найден`);
      }
      if (inventoryItem.quantity < itemData.quantity) {
        throw new BadRequestException(
          `Недостаточно товара "${inventoryItem.name}". Доступно: ${inventoryItem.quantity}, запрошено: ${itemData.quantity}`
        );
      }
    }

    // Используем транзакцию для атомарности операций
    // Convert deliveryDate string to Date object if needed (Prisma requires Date, not string)
    const deliveryDateValue = data.deliveryDate
      ? (data.deliveryDate instanceof Date ? data.deliveryDate : new Date(data.deliveryDate))
      : undefined;

    const shipment = await this.prisma.$transaction(async (tx) => {
      // Создаём отгрузку с позициями
      const newShipment = await tx.shipment.create({
        data: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          deliveryDate: deliveryDateValue,
          notes: data.notes,
          orderNumber: data.orderNumber,
          shippedById: userId,
          items: {
            create: data.items.map(item => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  quantity: true,
                  productType: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          shippedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Уменьшаем количество на складе для каждого товара (в транзакции)
      await Promise.all(
        data.items.map(async (itemData) => {
          const inventoryItem = inventoryItems.find(i => i.id === itemData.inventoryItemId)!;
          return tx.inventoryItem.update({
            where: { id: itemData.inventoryItemId },
            data: {
              quantity: inventoryItem.quantity - itemData.quantity,
            },
          });
        })
      );

      return newShipment;
    });

    this.notifications.notifyShipmentsChanged();
    this.notifications.notifyInventoryChanged();
    return shipment;
  }

  // Получить все отгрузки с пагинацией
  async getAllShipments(userId: string, options?: {
    status?: ShipmentStatus;
  }) {
    // Проверяем права пользователя
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new ForbiddenException('Пользователь не найден');
    }

    const where = options?.status ? { status: options.status } : {};

    const shipments = await this.prisma.shipment.findMany({
      where,
      select: {
        id: true,
        status: true,
        customerName: true,
        customerPhone: true,
        deliveryAddress: true,
        deliveryDate: true,
        orderNumber: true,
        notes: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            inventoryItem: {
              select: {
                id: true,
                name: true,
                productType: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        shippedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shipments;
  }

  // Получить отгрузки по статусу
  async getShipmentsByStatus(userId: string, status: ShipmentStatus) {
    // Получаем информацию о пользователе
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Пользователь не найден');
    }

    // Все пользователи (WAREHOUSE, MANAGER, OWNER) видят все отгрузки по статусу
    return this.prisma.shipment.findMany({
      where: { status },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                product: true,
                productType: true,
                order: true,
              },
            },
          },
        },
        shippedBy: {
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
    });
  }

  // Получить детали отгрузки
  async getShipment(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                product: true,
                productType: true,
                order: true,
              },
            },
          },
        },
        shippedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Отгрузка не найдена');
    }

    return shipment;
  }

  // Обновить статус отгрузки
  async updateShipmentStatus(id: string, userId: string, status: ShipmentStatus) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || (user.role?.code !== 'WAREHOUSE' && user.role?.code !== 'OWNER' && user.role?.code !== 'MANAGER')) {
      throw new ForbiddenException('Только складист, менеджер и владелец могут обновлять статус отгрузки');
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new NotFoundException('Отгрузка не найдена');
    }

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                product: true,
                productType: true,
                order: true,
              },
            },
          },
        },
        shippedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.notifications.notifyShipmentsChanged();
    return updated;
  }

  // Отменить отгрузку (вернуть товары на склад)
  async cancelShipment(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || (user.role?.code !== 'WAREHOUSE' && user.role?.code !== 'OWNER' && user.role?.code !== 'MANAGER')) {
      throw new ForbiddenException('Только складист, менеджер и владелец могут отменять отгрузки');
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Отгрузка не найдена');
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new BadRequestException('Нельзя отменить доставленную отгрузку');
    }

    if (shipment.status === ShipmentStatus.CANCELLED) {
      throw new BadRequestException('Отгрузка уже отменена');
    }

    // Используем транзакцию для атомарности
    const updatedShipment = await this.prisma.$transaction(async (tx) => {
      // Обновляем статус отгрузки
      const cancelled = await tx.shipment.update({
        where: { id },
        data: { status: ShipmentStatus.CANCELLED },
      });

      // Возвращаем товары на склад последовательно с проверкой
      for (const item of shipment.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });

        if (!inventoryItem) {
          throw new NotFoundException(
            `Позиция склада ${item.inventoryItemId} не найдена. Отмена отгрузки прервана.`,
          );
        }

        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: inventoryItem.quantity + item.quantity,
          },
        });
      }

      return cancelled;
    });

    this.notifications.notifyShipmentsChanged();
    this.notifications.notifyInventoryChanged();
    return updatedShipment;
  }

  // Получить данные для путевого листа
  async getWaybillData(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                product: true,
                productType: true,
                order: true,
              },
            },
          },
        },
        shippedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Отгрузка не найдена');
    }

    // Формируем данные для путевого листа
    return {
      shipmentId: shipment.id,
      shipmentDate: shipment.createdAt.toISOString(),
      customerName: shipment.customerName,
      customerPhone: shipment.customerPhone,
      deliveryAddress: shipment.deliveryAddress,
      deliveryDate: shipment.deliveryDate?.toISOString(),
      orderNumber: shipment.orderNumber || shipment.items[0]?.inventoryItem?.order?.orderNumber || '—',
      items: shipment.items.map(item => ({
        name: item.inventoryItem.name,
        quantity: item.quantity,
        productType: item.inventoryItem.productType.name,
        orderNumber: item.inventoryItem.order?.orderNumber,
      })),
      shippedBy: `${shipment.shippedBy.firstName} ${shipment.shippedBy.lastName}`,
      notes: shipment.notes,
    };
  }
}
