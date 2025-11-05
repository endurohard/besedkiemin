import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateCatalogOrderDto } from './dto/create-catalog-order.dto';
import { UpdateCatalogOrderDto } from './dto/update-catalog-order.dto';

@Injectable()
export class CatalogOrdersService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  async create(createDto: CreateCatalogOrderDto) {
    // Проверить, что все товары существуют и активны
    const productIds = createDto.items.map((item) => item.productId);
    const products = await this.prisma.catalogProduct.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Некоторые товары не найдены или неактивны');
    }

    // Генерировать номер заказа
    const orderCount = await this.prisma.catalogOrder.count();
    const orderNumber = `WEB-${String(orderCount + 1).padStart(6, '0')}`;

    // Подсчитать общую сумму
    let totalAmount = 0;
    const itemsData = createDto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const price = product?.price || 0;
      const quantity = item.quantity || 1;
      totalAmount += price * quantity;

      return {
        productId: item.productId,
        quantity,
        price,
        comment: item.comment,
      };
    });

    // Создать заказ с позициями
    return this.prisma.catalogOrder.create({
      data: {
        orderNumber,
        customerName: createDto.customerName,
        customerPhone: createDto.customerPhone,
        customerEmail: createDto.customerEmail,
        comment: createDto.comment,
        deliveryAddress: createDto.deliveryAddress,
        totalAmount: totalAmount > 0 ? totalAmount : null,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};

    return this.prisma.catalogOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.catalogOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Заказ с ID ${id} не найден`);
    }

    return order;
  }

  async update(id: string, updateDto: UpdateCatalogOrderDto) {
    await this.findOne(id); // Проверка существования

    return this.prisma.catalogOrder.update({
      where: { id },
      data: updateDto,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Проверка существования

    return this.prisma.catalogOrder.delete({
      where: { id },
    });
  }

  async markContacted(id: string, userId: string) {
    await this.findOne(id); // Проверка существования

    return this.prisma.catalogOrder.update({
      where: { id },
      data: {
        contactedAt: new Date(),
        contactedBy: userId,
        status: 'CONTACTED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async markProcessed(id: string, userId: string) {
    const catalogOrder = await this.findOne(id);

    // Проверить, не был ли уже создан производственный заказ для этого заказа
    const productionOrderNumber = catalogOrder.orderNumber.replace('WEB-', 'ORD-');
    const existingProductionOrder = await this.prisma.order.findFirst({
      where: { orderNumber: productionOrderNumber },
    });

    if (existingProductionOrder) {
      throw new BadRequestException('Производственный заказ уже был создан для этого заказа с сайта');
    }

    // Создать производственный заказ
    const productionOrder = await this.prisma.order.create({
      data: {
        orderNumber: productionOrderNumber,
        customerName: catalogOrder.customerName,
        customerPhone: catalogOrder.customerPhone,
        customerAddress: catalogOrder.deliveryAddress || '',
        status: 'NEW', // Начинаем как новый заказ
        createdById: userId,
      },
    });

    // Получить дефолтный тип продукта (можно будет изменить вручную потом)
    const defaultProductType = await this.prisma.productType.findFirst({
      where: { isActive: true },
    });

    if (!defaultProductType) {
      throw new BadRequestException('Не найдено активных типов продукции');
    }

    // Получить первую активную стадию workflow
    const firstStage = await this.prisma.workflowStage.findFirst({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (!firstStage) {
      throw new BadRequestException('Не найдено активных стадий производства');
    }

    // Получить работников для первой стадии
    const workers = await this.prisma.user.findMany({
      where: {
        role: firstStage.role,
        isActive: true,
      },
    });

    // Создать производственные изделия для каждой позиции заказа
    for (const item of catalogOrder.items) {
      const product = await this.prisma.product.create({
        data: {
          name: item.product.name,
          orderId: productionOrder.id,
          quantity: item.quantity,
          productTypeId: defaultProductType.id,
          stage: firstStage.legacyStage, // Используем legacyStage из первой стадии workflow
        },
        include: {
          productType: true,
          order: true,
        },
      });

      // Создать задачи для всех работников этой стадии
      for (const worker of workers) {
        const newTask = await this.prisma.task.create({
          data: {
            title: `${product.name} - ${firstStage.name}`,
            description: `Новый продукт для обработки. Заказ: ${productionOrder.orderNumber}`,
            stage: firstStage.legacyStage,
            productId: product.id,
            assignedToId: worker.id,
          },
        });

        // Отправляем уведомление через Telegram, если у работника есть telegramId
        if (worker.telegramId) {
          const message =
            `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
            `*Продукт:* ${product.name}\n` +
            `*Тип:* ${product.productType?.name || 'Н/Д'}\n` +
            `*Количество:* ${product.quantity} шт.\n` +
            `*Стадия:* ${firstStage.name}\n` +
            `*Заказ:* ${productionOrder.orderNumber}\n` +
            `*Клиент:* ${productionOrder.customerName || 'Н/Д'}\n` +
            `*Источник:* Заказ с сайта\n\n` +
            `✅ Откройте раздел "Мои задачи" для выполнения`;

          try {
            await this.telegramService.sendMessage(worker.telegramId, message);
            console.log(`📲 Уведомление отправлено работнику ${worker.email} (${worker.role})`);
          } catch (error) {
            console.error(`❌ Ошибка отправки уведомления работнику ${worker.email}:`, error);
          }
        }
      }
    }

    // Обновить заказ с сайта
    return this.prisma.catalogOrder.update({
      where: { id },
      data: {
        processedAt: new Date(),
        processedBy: userId,
        status: 'IN_WORK',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async cancelOrder(id: string, cancellationReason: string, userId: string) {
    await this.findOne(id); // Проверка существования

    return this.prisma.catalogOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason,
        processedAt: new Date(),
        processedBy: userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
