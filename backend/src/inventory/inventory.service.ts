import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // Получить все складские остатки
  async getAllInventory() {
    return this.prisma.inventoryItem.findMany({
      include: {
        product: true,
        productType: true,
        order: true,
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });
  }

  // Получить остатки по типу продукта
  async getInventoryByType(productTypeId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        productTypeId,
      },
      include: {
        product: true,
        productType: true,
        order: true,
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });
  }

  // Получить остатки по заказу
  async getInventoryByOrder(orderId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        orderId,
      },
      include: {
        product: true,
        productType: true,
        order: true,
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });
  }

  // Получить детали одного складского остатка
  async getInventoryItem(id: string) {
    return this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: true,
        productType: true,
        order: true,
        shipmentItems: {
          include: {
            shipment: {
              include: {
                shippedBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  // Получить сводку по остаткам (группировка по типам)
  async getInventorySummary() {
    const inventory = await this.prisma.inventoryItem.findMany({
      include: {
        productType: true,
      },
    });

    // Группируем по типам продуктов
    const summary = inventory.reduce((acc, item) => {
      const typeName = item.productType.name;
      if (!acc[typeName]) {
        acc[typeName] = {
          productType: item.productType,
          totalQuantity: 0,
          items: [],
        };
      }
      acc[typeName].totalQuantity += item.quantity;
      acc[typeName].items.push(item);
      return acc;
    }, {});

    return Object.values(summary);
  }
}
