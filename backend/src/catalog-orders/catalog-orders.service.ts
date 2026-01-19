import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateCatalogOrderDto } from './dto/create-catalog-order.dto';
import { UpdateCatalogOrderDto } from './dto/update-catalog-order.dto';
import { Prisma } from '@prisma/client';
import { PAGINATION, ORDER } from '../common/constants';

@Injectable()
export class CatalogOrdersService {
  private readonly logger = new Logger(CatalogOrdersService.name);

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
    const order = await this.prisma.catalogOrder.create({
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

    // Отправить уведомление в Telegram
    try {
      let message = `🛒 <b>Новый заказ с сайта!</b>\n\n`;
      message += `📋 Номер: <b>${orderNumber}</b>\n`;
      message += `👤 Клиент: ${createDto.customerName}\n`;
      message += `📞 Телефон: ${createDto.customerPhone}\n`;

      if (createDto.customerEmail) {
        message += `📧 Email: ${createDto.customerEmail}\n`;
      }

      if (createDto.comment) {
        message += `💬 Комментарий: ${createDto.comment}\n`;
      }

      if (createDto.deliveryAddress) {
        message += `📍 Адрес: ${createDto.deliveryAddress}\n`;
      }

      if (order.items.length > 0) {
        message += `\n📦 <b>Товары:</b>\n`;
        order.items.forEach((item) => {
          message += `   • ${item.product.name} x ${item.quantity} = ${(item.price * item.quantity).toLocaleString('ru-RU')} ₽\n`;
        });
        message += `\n💰 <b>Итого: ${totalAmount.toLocaleString('ru-RU')} ₽</b>`;
      } else {
        message += `\n<i>Товары не указаны (быстрая заявка)</i>`;
      }

      await this.telegramService.notifyAdmins(message);
    } catch (error) {
      this.logger.error('Ошибка отправки уведомления в Telegram:', error);
      // Не прерываем создание заказа, если не удалось отправить уведомление
    }

    return order;
  }

  async findAll(filters?: { status?: string; page?: number; limit?: number }) {
    const where: Prisma.CatalogOrderWhereInput = filters?.status ? { status: filters.status as any } : {};
    const page = Math.max(1, filters?.page || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_PAGE_SIZE, Math.max(1, filters?.limit || PAGINATION.DEFAULT_PAGE_SIZE));

    const [orders, total] = await Promise.all([
      this.prisma.catalogOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.catalogOrder.count({ where }),
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
      // Производственный заказ уже существует - просто обновляем статус
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

    // Параллельно получаем необходимые данные
    const [defaultProductType, firstStage] = await Promise.all([
      this.prisma.productType.findFirst({
        where: { isActive: true },
        select: { id: true, name: true },
      }),
      this.prisma.workflowStage.findFirst({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: { roles: { include: { role: true } } },
      }),
    ]);

    if (!defaultProductType) {
      throw new BadRequestException('Не найдено активных типов продукции');
    }

    if (!firstStage) {
      throw new BadRequestException('Не найдено активных стадий производства');
    }

    // Получаем работников для первой стадии (через many-to-many связь ролей)
    const firstStageRoleIds = firstStage.roles.map(r => r.roleId);
    const workers = await this.prisma.user.findMany({
      where: {
        roleId: { in: firstStageRoleIds },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: { select: { code: true, name: true } },
        telegramId: true,
      },
    });

    // Подготавливаем данные для обработки
    const itemsToProcess = catalogOrder.items.length > 0
      ? catalogOrder.items
      : [{
          product: { name: 'Заказ с сайта (уточнить состав)' },
          quantity: 1,
          price: 0
        }];

    // Используем транзакцию для атомарности
    const result = await this.prisma.$transaction(async (tx) => {
      // Создать производственный заказ
      const productionOrder = await tx.order.create({
        data: {
          orderNumber: productionOrderNumber,
          customerName: catalogOrder.customerName,
          customerPhone: catalogOrder.customerPhone,
          customerAddress: catalogOrder.deliveryAddress || '',
          status: 'NEW',
          createdById: userId,
        },
      });

      // Создаём продукты параллельно
      const products = await Promise.all(
        itemsToProcess.map((item) =>
          tx.product.create({
            data: {
              name: item.product.name,
              orderId: productionOrder.id,
              quantity: item.quantity,
              productTypeId: defaultProductType.id,
              stage: firstStage.legacyStage,
            },
          })
        )
      );

      // Создаём задачи для всех работников и продуктов параллельно
      const taskPromises = products.flatMap((product) =>
        workers.map((worker) =>
          tx.task.create({
            data: {
              title: `${product.name} - ${firstStage.name}`,
              description: `Новый продукт для обработки. Заказ: ${productionOrder.orderNumber}`,
              stage: firstStage.legacyStage,
              productId: product.id,
              assignedToId: worker.id,
            },
          })
        )
      );
      await Promise.all(taskPromises);

      // Обновить заказ с сайта
      const updatedOrder = await tx.catalogOrder.update({
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

      return { updatedOrder, products, productionOrder };
    });

    // Отправляем Telegram-уведомления вне транзакции (fire-and-forget)
    Promise.allSettled(
      result.products.flatMap((product) =>
        workers
          .filter((worker) => worker.telegramId)
          .map(async (worker) => {
            const message =
              `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
              `*Продукт:* ${product.name}\n` +
              `*Тип:* ${defaultProductType.name || 'Н/Д'}\n` +
              `*Количество:* ${product.quantity} шт.\n` +
              `*Стадия:* ${firstStage.name}\n` +
              `*Заказ:* ${result.productionOrder.orderNumber}\n` +
              `*Источник:* Заказ с сайта\n\n` +
              `✅ Откройте раздел "Мои задачи" для выполнения`;

            try {
              await this.telegramService.sendMessage(worker.telegramId, message);
              this.logger.log(`Уведомление отправлено работнику ${worker.email}`);
            } catch (error) {
              this.logger.error(`Ошибка отправки уведомления работнику ${worker.email}:`, error);
            }
          })
      )
    );

    return result.updatedOrder;
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
