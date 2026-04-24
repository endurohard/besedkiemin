import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramService } from "../telegram/telegram.service";
import { InventoryService } from "../inventory/inventory.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductionStage, OrderStatus } from "@prisma/client";

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private inventoryService: InventoryService,
  ) {}

  async createFromInventory(dto: CreateProductDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException("Заказ не найден");
    }

    return this.prisma.$transaction(async (tx) => {
      await this.inventoryService.consumeInventoryTx(tx, {
        productTypeId: dto.productTypeId,
        name: dto.name,
        quantity: dto.quantity,
      });

      const product = await tx.product.create({
        data: {
          name: dto.name,
          productTypeId: dto.productTypeId,
          description: dto.description,
          quantity: dto.quantity,
          dimensions: dto.dimensions,
          schemaImageUrl: dto.schemaImageUrl,
          schemaImageUrls: dto.schemaImageUrls ?? [],
          orderId: dto.orderId,
          deadline: dto.deadline,
          stage: ProductionStage.COMPLETED,
          color: dto.color,
          upholsteryMaterial: dto.upholsteryMaterial,
          requiresSewing: dto.requiresSewing,
          nomenclatureId: dto.nomenclatureId,
          isCustom: dto.isCustom ?? false,
        },
        include: { order: true, productType: true },
      });

      // Обновляем статус заказа: если все позиции COMPLETED — заказ COMPLETED
      const siblings = await tx.product.findMany({
        where: { orderId: dto.orderId },
      });
      const allCompleted = siblings.every(
        (p) => p.stage === ProductionStage.COMPLETED,
      );
      if (allCompleted) {
        await tx.order.update({
          where: { id: dto.orderId },
          data: { status: OrderStatus.COMPLETED },
        });
      } else {
        await tx.order.update({
          where: { id: dto.orderId },
          data: { status: OrderStatus.IN_PRODUCTION },
        });
      }

      return product;
    });
  }

  async create(createProductDto: CreateProductDto) {
    // Проверяем существует ли заказ
    const order = await this.prisma.order.findUnique({
      where: { id: createProductDto.orderId },
    });

    if (!order) {
      throw new NotFoundException("Заказ не найден");
    }

    // Получаем стартовую стадию: явно заданная > needsDesign (DESIGN) > первая активная стадия.
    const effectiveStartStage =
      createProductDto.startStage ??
      (createProductDto.needsDesign ? ProductionStage.DESIGN : undefined);

    const firstWorkflowStage = effectiveStartStage
      ? await this.prisma.workflowStage.findFirst({
          where: { isActive: true, legacyStage: effectiveStartStage },
          include: { roles: { include: { role: true } } },
        })
      : await this.prisma.workflowStage.findFirst({
          where: { isActive: true },
          orderBy: { order: "asc" },
          include: { roles: { include: { role: true } } },
        });

    if (!firstWorkflowStage) {
      throw new NotFoundException(
        effectiveStartStage
          ? `Стадия ${effectiveStartStage} не найдена или неактивна`
          : "Не найдены активные стадии workflow",
      );
    }

    // Получаем работников первой стадии
    const roleIds = firstWorkflowStage.roles.map((r) => r.roleId) || [];
    const workers =
      roleIds.length > 0
        ? await this.prisma.user.findMany({
            where: {
              roleId: { in: roleIds },
              isActive: true,
            },
            include: { role: true },
          })
        : [];

    // Определяем работников для назначения
    const assignments = createProductDto.stageAssignments || {};
    const firstStageKey = firstWorkflowStage.legacyStage;
    const assignedWorkerId =
      createProductDto.assignedWorkerId ||
      (firstStageKey ? assignments[firstStageKey] : undefined);
    const taskWorkers = assignedWorkerId
      ? workers.filter((w) => w.id === assignedWorkerId)
      : workers;

    // Используем транзакцию для атомарности
    const product = await this.prisma.$transaction(async (tx) => {
      // Создаем продукт на первой стадии workflow
      const newProduct = await tx.product.create({
        data: {
          name: createProductDto.name,
          productTypeId: createProductDto.productTypeId,
          description: createProductDto.description,
          quantity: createProductDto.quantity,
          dimensions: createProductDto.dimensions,
          schemaImageUrl: createProductDto.schemaImageUrl,
          schemaImageUrls: createProductDto.schemaImageUrls ?? [],
          orderId: createProductDto.orderId,
          deadline: createProductDto.deadline,
          stage: firstWorkflowStage.legacyStage!,
          color: createProductDto.color,
          upholsteryMaterial: createProductDto.upholsteryMaterial,
          requiresSewing: createProductDto.requiresSewing,
          nomenclatureId: createProductDto.nomenclatureId,
          isCustom: createProductDto.isCustom ?? false,
          needsDesign: createProductDto.needsDesign ?? false,
          stageAssignments: createProductDto.stageAssignments || undefined,
        },
        include: {
          order: true,
          productType: true,
        },
      });

      // Создаем задачи для работников первой стадии
      if (taskWorkers.length > 0) {
        await Promise.all(
          taskWorkers.map((worker) =>
            tx.task.create({
              data: {
                title: `${newProduct.name} - ${firstWorkflowStage.name}`,
                description: `Новый продукт. Заказ: ${order.orderNumber}`,
                stage: firstWorkflowStage.legacyStage!,
                productId: newProduct.id,
                assignedToId: worker.id,
                quantity: newProduct.quantity,
                workflowStageId: firstWorkflowStage.id,
              },
            }),
          ),
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
    if (taskWorkers.length > 0) {
      Promise.allSettled(
        taskWorkers
          .filter((worker) => worker.telegramId)
          .map(async (worker) => {
            const message =
              `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
              `*Продукт:* ${product.name}\n` +
              `*Тип:* ${(product as any).productType?.name || "Н/Д"}\n` +
              `*Количество:* ${product.quantity} шт.\n` +
              `*Стадия:* ${firstWorkflowStage.name}\n` +
              `*Заказ:* ${order.orderNumber}\n\n` +
              `✅ Откройте раздел "Мои задачи" для выполнения`;

            try {
              await this.telegramService.sendMessage(
                worker.telegramId!,
                message,
              );
              this.logger.log(
                `Уведомление отправлено работнику ${worker.email}`,
              );
            } catch (error) {
              this.logger.error(
                `Ошибка отправки уведомления работнику ${worker.email}:`,
                error,
              );
            }
          }),
      );
    }

    return product;
  }

  async findAll(filters?: {
    orderId?: string;
    stage?: ProductionStage;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters?.stage) {
      where.stage = filters.stage;
    }

    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(200, Math.max(1, filters?.limit || 200));

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              status: true,
              priority: true,
            },
          },
          productType: {
            select: {
              id: true,
              name: true,
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
              startedAt: "desc",
            },
            take: 5, // Только последние 5 записей истории для списка
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
              createdAt: "desc",
            },
            take: 3, // Только последние 3 проверки для списка
          },
          tasks: {
            where: { status: { in: ["NEW", "ACCEPTED"] } },
            select: {
              id: true,
              stage: true,
              status: true,
              isDefect: true,
              assignedTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: { select: { code: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return products;
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
            startedAt: "asc",
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
            createdAt: "desc",
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException("Продукт не найден");
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

    // Валидация перехода между этапами (динамически из WorkflowStage)
    await this.validateStageTransition(product.stage, newStage);

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
            startedAt: "desc",
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
        startedAt: "asc",
      },
    });
  }

  // Валидация переходов между этапами — динамически из WorkflowStage
  private async validateStageTransition(
    currentStage: ProductionStage,
    newStage: ProductionStage,
  ) {
    // COMPLETED — финальный этап, переходов нет
    if (currentStage === ProductionStage.COMPLETED) {
      throw new BadRequestException(
        `Невозможен переход с этапа ${currentStage} на ${newStage}`,
      );
    }

    // REJECTED — можно вернуть на любой активный этап workflow
    if (currentStage === ProductionStage.REJECTED) {
      const activeStages = await this.prisma.workflowStage.findMany({
        where: { isActive: true },
        select: { legacyStage: true },
      });
      const activeStageValues = activeStages.map((s) => s.legacyStage);
      if (!activeStageValues.includes(newStage)) {
        throw new BadRequestException(
          `Невозможен переход с этапа ${currentStage} на ${newStage}`,
        );
      }
      return;
    }

    // Получаем все активные этапы workflow по порядку
    const workflowStages = await this.prisma.workflowStage.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    const currentIndex = workflowStages.findIndex(
      (s) => s.legacyStage === currentStage,
    );
    const newIndex = workflowStages.findIndex(
      (s) => s.legacyStage === newStage,
    );
    const lastStage = workflowStages[workflowStages.length - 1];

    // С последнего этапа workflow можно перейти в COMPLETED, REJECTED или любой предыдущий
    if (lastStage && currentStage === lastStage.legacyStage) {
      if (
        newStage === ProductionStage.COMPLETED ||
        newStage === ProductionStage.REJECTED
      ) {
        return;
      }
      if (newIndex >= 0) {
        return; // Можно вернуть на любой этап workflow
      }
    }

    // Между этапами workflow: можно вперёд на +1 или назад на любой предыдущий
    if (currentIndex >= 0 && newIndex >= 0) {
      // Вперёд: только следующий этап (или через один при пропуске SEWING)
      if (newIndex === currentIndex + 1 || newIndex === currentIndex + 2) {
        return;
      }
      // Назад: любой предыдущий этап (возврат на доработку)
      if (newIndex < currentIndex) {
        return;
      }
    }

    // PENDING → первый этап workflow
    if (currentStage === ProductionStage.PENDING && newIndex === 0) {
      return;
    }

    throw new BadRequestException(
      `Невозможен переход с этапа ${currentStage} на ${newStage}`,
    );
  }

  // Автоматическое обновление статуса заказа
  private async updateOrderStatus(orderId: string) {
    const products = await this.prisma.product.findMany({
      where: { orderId },
    });

    if (products.length === 0) return;

    // Если все продукты завершены
    const allCompleted = products.every(
      (p) => p.stage === ProductionStage.COMPLETED,
    );

    // Если все продукты в PENDING — возвращаем заказ в NEW
    const allPending = products.every(
      (p) => p.stage === ProductionStage.PENDING,
    );

    // Если хотя бы один продукт не в PENDING и не COMPLETED
    const hasStarted = products.some(
      (p) => p.stage !== ProductionStage.PENDING,
    );

    let newStatus: OrderStatus;

    if (allCompleted) {
      newStatus = OrderStatus.COMPLETED;
    } else if (allPending) {
      newStatus = OrderStatus.NEW;
    } else if (hasStarted) {
      newStatus = OrderStatus.IN_PRODUCTION;
    } else {
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  }
}
