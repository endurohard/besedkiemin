import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // Добавить товар на склад вручную (для менеджера)
  async createInventoryItem(data: {
    name: string;
    productTypeId: string;
    quantity: number;
    notes?: string;
  }) {
    // Проверяем, что тип продукта существует
    const productType = await this.prisma.productType.findUnique({
      where: { id: data.productTypeId },
    });

    if (!productType) {
      throw new NotFoundException("Тип товара не найден");
    }

    if (data.quantity <= 0) {
      throw new BadRequestException("Количество должно быть больше 0");
    }

    // Создаём товар на складе без привязки к заказу/продукту
    return this.prisma.inventoryItem.create({
      data: {
        name: data.name,
        quantity: data.quantity,
        productTypeId: data.productTypeId,
        notes: data.notes,
        receivedAt: new Date(),
      },
      include: {
        productType: true,
      },
    });
  }

  // Получить все складские остатки
  async getAllInventory(options?: { productTypeId?: string }) {
    const where = options?.productTypeId
      ? { productTypeId: options.productTypeId }
      : {};

    const items = await this.prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        quantity: true,
        notes: true,
        receivedAt: true,
        createdAt: true,
        productType: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            stage: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
          },
        },
      },
      orderBy: {
        receivedAt: "desc",
      },
    });

    return items;
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
        receivedAt: "desc",
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
        receivedAt: "desc",
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
            createdAt: "desc",
          },
        },
      },
    });
  }

  // Получить суммарный остаток по типу + названию (точное совпадение)
  async getAvailability(productTypeId: string, name: string) {
    const aggregate = await this.prisma.inventoryItem.aggregate({
      where: {
        productTypeId,
        name,
        quantity: { gt: 0 },
      },
      _sum: { quantity: true },
    });
    return { quantity: aggregate._sum.quantity || 0 };
  }

  // Списать FIFO со склада. Должно вызываться внутри транзакции Prisma (tx).
  async consumeInventoryTx(
    tx: Parameters<Parameters<PrismaService["$transaction"]>[0]>[0],
    params: { productTypeId: string; name: string; quantity: number },
  ): Promise<number> {
    if (params.quantity <= 0) {
      throw new BadRequestException("Количество для списания должно быть больше 0");
    }

    const items = await tx.inventoryItem.findMany({
      where: {
        productTypeId: params.productTypeId,
        name: params.name,
        quantity: { gt: 0 },
      },
      orderBy: { receivedAt: "asc" },
    });

    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    if (total < params.quantity) {
      throw new BadRequestException(
        `На складе недостаточно: нужно ${params.quantity}, доступно ${total}`,
      );
    }

    let remaining = params.quantity;
    for (const item of items) {
      if (remaining <= 0) break;
      const take = Math.min(item.quantity, remaining);
      const nextQty = item.quantity - take;
      if (nextQty === 0) {
        await tx.inventoryItem.delete({ where: { id: item.id } });
      } else {
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: { quantity: nextQty },
        });
      }
      remaining -= take;
    }

    return params.quantity;
  }

  // Получить сводку по остаткам (группировка по типам) - оптимизированный
  async getInventorySummary() {
    // Используем groupBy для агрегации на уровне БД
    const aggregated = await this.prisma.inventoryItem.groupBy({
      by: ["productTypeId"],
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
    });

    // Получаем типы продуктов одним запросом
    const productTypeIds = aggregated.map((a) => a.productTypeId);
    const productTypes = await this.prisma.productType.findMany({
      where: {
        id: { in: productTypeIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productTypeMap = new Map(productTypes.map((pt) => [pt.id, pt]));

    return aggregated.map((a) => ({
      productType: productTypeMap.get(a.productTypeId),
      totalQuantity: a._sum.quantity || 0,
      itemCount: a._count.id,
    }));
  }
}
