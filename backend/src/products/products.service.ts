import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductionStage, OrderStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    // Проверяем существует ли заказ
    const order = await this.prisma.order.findUnique({
      where: { id: createProductDto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    // Получаем первую активную стадию workflow (должна быть PENDING - Менеджер)
    const firstWorkflowStage = await this.prisma.workflowStage.findFirst({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (!firstWorkflowStage) {
      throw new NotFoundException('Не найдены активные стадии workflow');
    }

    // Получаем вторую стадию workflow с ролями
    const secondWorkflowStage = await this.prisma.workflowStage.findFirst({
      where: {
        isActive: true,
        order: { gt: firstWorkflowStage.order }
      },
      orderBy: { order: 'asc' },
      include: {
        roles: { include: { role: true } },
      },
    });

    // Получаем работников следующей стадии заранее (через many-to-many связь ролей)
    const roleIds = secondWorkflowStage?.roles.map(r => r.roleId) || [];
    const nextWorkers = roleIds.length > 0
      ? await this.prisma.user.findMany({
          where: {
            roleId: { in: roleIds },
            isActive: true,
          },
          include: { role: true },
        })
      : [];

    // Используем транзакцию для атомарности
    const product = await this.prisma.$transaction(async (tx) => {
      // Создаем продукт в первой стадии workflow
      const newProduct = await tx.product.create({
        data: {
          name: createProductDto.name,
          productTypeId: createProductDto.productTypeId,
          description: createProductDto.description,
          quantity: createProductDto.quantity,
          dimensions: createProductDto.dimensions,
          schemaImageUrl: createProductDto.schemaImageUrl,
          orderId: createProductDto.orderId,
          deadline: createProductDto.deadline,
          stage: secondWorkflowStage?.legacyStage || firstWorkflowStage.legacyStage,
        },
        include: {
          order: true,
          productType: true,
        },
      });

      if (secondWorkflowStage) {
        // Создаем запись в истории для первой стадии
        await tx.productHistory.create({
          data: {
            productId: newProduct.id,
            userId: order.createdById,
            stage: firstWorkflowStage.legacyStage,
            status: 'PASSED',
            startedAt: new Date(),
            completedAt: new Date(),
            passedAt: new Date(),
          },
        });

        // Создаем задачи для работников следующей стадии параллельно
        await Promise.all(
          nextWorkers.map((worker) =>
            tx.task.create({
              data: {
                title: `${newProduct.name} - ${secondWorkflowStage.name}`,
                description: `Новый продукт. Заказ: ${order.orderNumber}`,
                stage: secondWorkflowStage.legacyStage,
                productId: newProduct.id,
                assignedToId: worker.id,
                quantity: newProduct.quantity,
              },
            })
          )
        );

        // Обновляем статус заказа на IN_PRODUCTION
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.IN_PRODUCTION },
        });
      }

      return newProduct;
    });

    // Отправляем Telegram-уведомления вне транзакции (fire-and-forget)
    if (secondWorkflowStage) {
      Promise.allSettled(
        nextWorkers
          .filter((worker) => worker.telegramId)
          .map(async (worker) => {
            const message =
              `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
              `*Продукт:* ${product.name}\n` +
              `*Тип:* ${product.productType?.name || 'Н/Д'}\n` +
              `*Количество:* ${product.quantity} шт.\n` +
              `*Стадия:* ${secondWorkflowStage.name}\n` +
              `*Заказ:* ${order.orderNumber}\n` +
              `*Клиент:* ${order.customerName || 'Н/Д'}\n\n` +
              `✅ Откройте раздел "Мои задачи" для выполнения`;

            try {
              await this.telegramService.sendMessage(worker.telegramId, message);
              console.log(`📲 Уведомление отправлено работнику ${worker.email} (${worker.role.code})`);
            } catch (error) {
              console.error(`❌ Ошибка отправки уведомления работнику ${worker.email}:`, error);
            }
          })
      );
    }

    return product;
  }

  async findAll(filters?: {
    orderId?: string;
    stage?: ProductionStage;
  }) {
    const where: any = {};

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters?.stage) {
      where.stage = filters.stage;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            status: true,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        order: true,
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
    });

    if (!product) {
      throw new NotFoundException('Продукт не найден');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        order: true,
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
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.product.delete({
      where: { id },
    });
  }

  // Движение по этапам производства
  async moveToStage(
    productId: string,
    newStage: ProductionStage,
    userId: string,
    notes?: string,
  ) {
    const product = await this.findOne(productId);

    // Валидация перехода между этапами
    this.validateStageTransition(product.stage, newStage);

    // Завершаем текущий этап если есть активная история
    const activeHistory = await this.prisma.productHistory.findFirst({
      where: {
        productId,
        completedAt: null,
      },
    });

    if (activeHistory) {
      await this.prisma.productHistory.update({
        where: { id: activeHistory.id },
        data: {
          completedAt: new Date(),
        },
      });
    }

    // Создаем новую запись в истории
    await this.prisma.productHistory.create({
      data: {
        productId,
        stage: newStage,
        userId,
        notes,
        startedAt: new Date(),
      },
    });

    // Обновляем текущий этап продукта
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { stage: newStage },
      include: {
        order: true,
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
        },
      },
    });

    // Обновляем статус заказа если нужно
    await this.updateOrderStatus(product.orderId);

    return updatedProduct;
  }

  // Получить продукты по этапу
  async getProductsByStage(stage: ProductionStage) {
    return this.findAll({ stage });
  }

  // Получить историю продукта
  async getProductHistory(productId: string) {
    await this.findOne(productId); // Проверяем существование

    return this.prisma.productHistory.findMany({
      where: { productId },
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
    });
  }

  // Валидация переходов между этапами
  private validateStageTransition(
    currentStage: ProductionStage,
    newStage: ProductionStage,
  ) {
    const validTransitions: Record<ProductionStage, ProductionStage[]> = {
      [ProductionStage.PENDING]: [ProductionStage.DESIGN],
      [ProductionStage.DESIGN]: [ProductionStage.PREPARATION, ProductionStage.PENDING],
      [ProductionStage.PREPARATION]: [ProductionStage.PAINTING, ProductionStage.DESIGN],
      [ProductionStage.PAINTING]: [ProductionStage.QUALITY_CHECK, ProductionStage.PREPARATION],
      [ProductionStage.QUALITY_CHECK]: [
        ProductionStage.COMPLETED,
        ProductionStage.REJECTED,
        ProductionStage.PAINTING, // Возврат на покраску при браке
      ],
      [ProductionStage.COMPLETED]: [], // Финальный этап
      [ProductionStage.REJECTED]: [ProductionStage.PAINTING], // Можно вернуть на покраску
    };

    const allowedTransitions = validTransitions[currentStage] || [];

    if (!allowedTransitions.includes(newStage)) {
      throw new BadRequestException(
        `Невозможен переход с этапа ${currentStage} на ${newStage}`,
      );
    }
  }

  // Автоматическое обновление статуса заказа
  private async updateOrderStatus(orderId: string) {
    const products = await this.prisma.product.findMany({
      where: { orderId },
    });

    // Если все продукты завершены
    const allCompleted = products.every(
      (p) => p.stage === ProductionStage.COMPLETED,
    );

    // Если хотя бы один продукт не в PENDING
    const hasStarted = products.some(
      (p) => p.stage !== ProductionStage.PENDING,
    );

    let newStatus: OrderStatus | null = null;

    if (allCompleted && products.length > 0) {
      newStatus = OrderStatus.COMPLETED;
    } else if (hasStarted) {
      newStatus = OrderStatus.IN_PRODUCTION;
    }

    if (newStatus) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
    }
  }
}
