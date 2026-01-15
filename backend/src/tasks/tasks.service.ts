import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { PayrollService } from '../payroll/payroll.service';
import { TaskStatus, ProductionStage } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    @Inject(forwardRef(() => PayrollService))
    private payrollService: PayrollService,
  ) {}

  // Получить задачи текущего пользователя
  async getMyTasks(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Определяем стадию по роли
    const stageMapping = {
      ['DESIGNER']: ProductionStage.DESIGN,
      ['PREPARER']: ProductionStage.PREPARATION,
      ['PAINTER']: ProductionStage.PAINTING,
      ['SEWER']: ProductionStage.SEWING,
      ['ASSEMBLER']: ProductionStage.ASSEMBLY,
      ['WAREHOUSE']: ProductionStage.QUALITY_CHECK,
    };

    const roleCode = user.role?.code;
    const stage = roleCode ? stageMapping[roleCode] : undefined;

    if (!stage) {
      // Для MANAGER возвращаем пустой массив - у них нет производственных задач
      // Менеджеры работают с заказами с сайта через отдельную страницу /catalog-orders
      if (roleCode === 'MANAGER') {
        return [];
      }

      // Для OWNER возвращаем все задачи отсортированные по приоритету
      return this.prisma.task.findMany({
        include: {
          product: {
            include: {
              productType: true,
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  customerName: true,
                  priority: true,
                },
              },
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: { select: { code: true, name: true } },
            },
          },
        },
        orderBy: [
          { priority: 'desc' }, // Сначала по приоритету задачи
          { createdAt: 'desc' }, // Потом по дате создания
        ],
      });
    }

    // Для работников возвращаем только их задачи на их стадии, отсортированные по приоритету
    // ВАЖНО: фильтруем задачи, где этап задачи совпадает с этапом продукта
    const tasks = await this.prisma.task.findMany({
      where: {
        assignedToId: userId,
        stage: stage,
      },
      include: {
        product: {
          include: {
            productType: true,
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerName: true,
                customerPhone: true,
                customerAddress: true,
                status: true,
                priority: true,
                description: true,
                createdById: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // Сначала по приоритету задачи (URGENT > HIGH > NORMAL > LOW)
        { createdAt: 'desc' }, // Потом по дате создания
      ],
    });

    // Фильтруем только актуальные задачи, где этап задачи совпадает с текущим этапом продукта
    return tasks.filter(task => task.product.stage === task.stage);
  }

  // Получить сотрудников своего отдела (той же роли)
  async getDepartmentWorkers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Получаем всех активных пользователей с той же ролью
    return this.prisma.user.findMany({
      where: {
        roleId: user.roleId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  // Принять задачу в работу
  async acceptTask(taskId: string, workerId: string, requesterId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        product: true,
        assignedTo: { include: { role: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    if (task.status !== TaskStatus.NEW) {
      throw new BadRequestException('Задача уже принята или завершена');
    }

    // Получаем информацию о выбранном работнике
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
      include: { role: true },
    });

    if (!worker) {
      throw new NotFoundException('Работник не найден');
    }

    // Проверяем что выбранный работник из того же отдела (та же роль)
    if (task.assignedTo?.roleId !== worker.roleId) {
      throw new ForbiddenException('Работник не из этого отдела');
    }

    // Если передан requesterId, проверяем что запрашивающий тоже из того же отдела
    if (requesterId && requesterId !== workerId) {
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { role: true },
      });
      if (!requester || requester.roleId !== worker.roleId) {
        throw new ForbiddenException('Вы не можете назначить задачу работнику из другого отдела');
      }
    }

    // Удаляем копии этой задачи у других работников той же роли
    await this.prisma.task.deleteMany({
      where: {
        productId: task.productId,
        stage: task.stage,
        status: TaskStatus.NEW,
        id: { not: taskId }, // Все кроме текущей
      },
    });

    // Обновляем задачу и назначаем выбранному работнику
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.ACCEPTED,
        acceptedAt: new Date(),
        assignedToId: workerId, // Назначаем выбранному работнику
      },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
          },
        },
      },
    });
  }

  // Завершить задачу
  async completeTask(taskId: string, userId: string, notes?: string, quantity?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { product: true },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    if (task.assignedToId !== userId) {
      throw new ForbiddenException('Вы не можете завершить эту задачу');
    }

    if (task.status !== TaskStatus.ACCEPTED) {
      throw new BadRequestException('Задача должна быть сначала принята в работу');
    }

    // Если количество не указано, используем количество из задачи
    const completedQuantity = quantity || task.quantity;
    const remainingQuantity = task.quantity - completedQuantity;

    // Если завершено меньше чем нужно, создаем новую задачу с остатком
    if (remainingQuantity > 0) {
      await this.prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          stage: task.stage,
          productId: task.productId,
          assignedToId: task.assignedToId,
          quantity: remainingQuantity,
          priority: task.priority,
          status: TaskStatus.NEW, // Новая задача для оставшихся изделий
        },
      });
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        notes,
        quantity: completedQuantity,
      },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
          },
        },
      },
    });
  }

  // Передать задачу дальше (следующей роли)
  async passTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { product: { include: { productType: true } } },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    if (task.assignedToId !== userId) {
      throw new ForbiddenException('Вы не можете передать эту задачу');
    }

    if (task.status !== TaskStatus.COMPLETED) {
      throw new BadRequestException('Задача должна быть сначала завершена');
    }

    // Получаем текущую стадию workflow
    const currentWorkflowStage = await this.prisma.workflowStage.findFirst({
      where: {
        legacyStage: task.stage,
        isActive: true,
      },
    });

    if (!currentWorkflowStage) {
      throw new BadRequestException('Текущая стадия workflow не найдена');
    }

    // Получаем следующую стадию workflow с ролями
    let nextWorkflowStage = await this.prisma.workflowStage.findFirst({
      where: {
        order: currentWorkflowStage.order + 1,
        isActive: true,
      },
      include: { roles: { include: { role: true } } },
    });

    if (!nextWorkflowStage) {
      throw new BadRequestException('Следующая стадия workflow не найдена');
    }

    // Пропускаем этап SEWING если продукт не требует пошива
    // Приоритет: upholsteryMaterial > product.requiresSewing > productType.requiresSewing
    // Если указан материал обшивки - пошив обязателен
    const product = task.product;
    const productType = product.productType;
    const needsSewing = product.upholsteryMaterial
      ? true  // Если указан материал обшивки - пошив обязателен
      : (product.requiresSewing !== null
          ? product.requiresSewing
          : productType?.requiresSewing ?? false);

    if (nextWorkflowStage.legacyStage === ProductionStage.SEWING && !needsSewing) {
      this.logger.log(`Skipping SEWING stage for product ${product.name} - requiresSewing is false`);
      const afterSewingStage = await this.prisma.workflowStage.findFirst({
        where: {
          order: nextWorkflowStage.order + 1,
          isActive: true,
        },
        include: { roles: { include: { role: true } } },
      });

      if (afterSewingStage) {
        nextWorkflowStage = afterSewingStage;
      }
    }

    const completedQuantity = task.quantity || task.product.quantity;

    // Обновляем задачу
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.PASSED,
        passedAt: new Date(),
      },
    });

    // Создаем запись в истории
    await this.prisma.productHistory.create({
      data: {
        productId: task.productId,
        userId: userId,
        stage: task.stage,
        status: TaskStatus.PASSED,
        completedAt: new Date(),
        passedAt: new Date(),
      },
    });

    // Создаем запись в журнале работ для расчета зарплаты
    try {
      await this.payrollService.createWorkLog({
        userId,
        productId: task.productId,
        taskId: task.id,
        productTypeId: task.product.productTypeId,
        stage: task.stage,
        workflowStageId: currentWorkflowStage.id,
        quantity: completedQuantity,
        completedAt: new Date(),
        notes: task.notes || undefined,
      });
      this.logger.log(`WorkLog created for user ${userId}, task ${taskId}, stage ${task.stage}`);
    } catch (error) {
      this.logger.error(`Failed to create WorkLog for task ${taskId}:`, error);
      // Не прерываем процесс, если не удалось создать WorkLog
    }

    // Обновляем стадию продукта
    await this.prisma.product.update({
      where: { id: task.productId },
      data: {
        stage: nextWorkflowStage.legacyStage,
      },
    });

    // Обновляем статус заказа
    await this.updateOrderStatus(task.product.orderId);

    // Создаем новые задачи для всех работников следующей стадии
    const nextStageRoleIds = nextWorkflowStage.roles.map(r => r.roleId);
    const nextWorkers = await this.prisma.user.findMany({
      where: {
        roleId: { in: nextStageRoleIds },
        isActive: true,
      },
      include: { role: true },
    });

    // Создаем задачу для каждого работника (общий цех) с переданным количеством
    for (const worker of nextWorkers) {
      const newTask = await this.prisma.task.create({
        data: {
          title: `${task.product.name} - ${nextWorkflowStage.name}`,
          description: `Количество: ${completedQuantity} шт.`,
          stage: nextWorkflowStage.legacyStage,
          productId: task.productId,
          assignedToId: worker.id,
          quantity: completedQuantity, // Устанавливаем переданное количество
        },
        include: {
          product: {
            include: {
              productType: true,
              order: true,
            },
          },
        },
      });

      // Отправляем уведомление через Telegram, если у работника есть telegramId
      if (worker.telegramId) {
        const message =
          `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
          `*Продукт:* ${newTask.product.name}\n` +
          `*Тип:* ${(newTask.product as any).productType?.name || 'Н/Д'}\n` +
          `*Количество:* ${completedQuantity} шт.\n` +
          `*Стадия:* ${nextWorkflowStage.name}\n` +
          `*Заказ:* ${(newTask.product as any).order?.orderNumber || 'Н/Д'}\n\n` +
          `✅ Откройте раздел "Мои задачи" для выполнения`;

        try {
          await this.telegramService.sendMessage(worker.telegramId, message);
          this.logger.log(`Уведомление отправлено работнику ${worker.email}`);
        } catch (error) {
          this.logger.error(`Ошибка отправки уведомления работнику ${worker.email}:`, error);
        }
      }
    }

    return updatedTask;
  }

  // Забраковать задачу (только для складиста)
  async rejectTask(taskId: string, userId: string, notes: string, quantity?: number, defectPhotoUrl?: string, requestPhoto?: boolean, returnToStage?: string) {
    this.logger.debug('rejectTask called', { taskId, userId, notes, quantity, defectPhotoUrl, requestPhoto, returnToStage });

    const user = await this.prisma.user.findUnique({
      where: { id: userId }, include: { role: true },
    });

    this.logger.debug('User found', { email: user?.email, role: user?.role?.code });

    if (!user || user.role?.code !== 'WAREHOUSE') {
      this.logger.warn('Attempted reject by non-warehouse user', { userId });
      throw new ForbiddenException('Только складист может браковать товар');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
          }
        }
      },
    });

    this.logger.debug('Task found', { title: task?.title, status: task?.status, stage: task?.stage });

    if (!task) {
      this.logger.warn('Task not found', { taskId });
      throw new NotFoundException('Задача не найдена');
    }

    if (task.assignedToId !== userId) {
      this.logger.warn('Task not assigned to user', { taskId, userId });
      throw new ForbiddenException('Вы не можете забраковать эту задачу');
    }

    if (task.stage !== ProductionStage.QUALITY_CHECK) {
      this.logger.warn('Task not at QUALITY_CHECK stage', { taskId, stage: task.stage });
      throw new BadRequestException('Браковать можно только на стадии проверки качества');
    }

    this.logger.debug('All validations passed, proceeding with rejection');

    // Проверяем доступное количество для брака
    const availableQuantity = task.quantity - task.quantityProcessed;
    const rejectQuantity = quantity || availableQuantity;

    if (rejectQuantity > availableQuantity) {
      throw new BadRequestException(`Нельзя забраковать ${rejectQuantity} шт. Доступно только ${availableQuantity} шт.`);
    }

    this.logger.debug(`Rejecting ${rejectQuantity} out of ${availableQuantity} available (total: ${task.quantity})`);

    // Увеличиваем количество обработанного
    const newQuantityProcessed = task.quantityProcessed + rejectQuantity;
    const isFullyProcessed = newQuantityProcessed >= task.quantity;

    // Обновляем задачу
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: isFullyProcessed ? TaskStatus.REJECTED : task.status, // REJECTED только если все обработано
        rejectedAt: isFullyProcessed ? new Date() : task.rejectedAt,
        notes,
        quantityProcessed: newQuantityProcessed,
        // defectPhotos будет обновлено позже ботом после получения фото
      },
    });

    // Возвращаем ТОЛЬКО забракованное количество продукта в малярку
    // Если это частичный брак, создаем новый продукт
    if (rejectQuantity < task.product.quantity) {
      // Частичный брак - создаем новый продукт для брака
      await this.prisma.product.create({
        data: {
          name: `${task.product.name} (БРАК ${rejectQuantity} шт.)`,
          productTypeId: task.product.productTypeId,
          quantity: rejectQuantity,
          stage: ProductionStage.PAINTING,
          orderId: task.product.orderId,
          dimensions: task.product.dimensions,
          schemaImageUrl: task.product.schemaImageUrl,
          deadline: task.product.deadline,
        },
      });
    } else {
      // Полный брак - возвращаем весь продукт
      await this.prisma.product.update({
        where: { id: task.productId },
        data: {
          stage: ProductionStage.PAINTING,
        },
      });
    }

    // Обновляем статус заказа
    await this.updateOrderStatus(task.product.orderId);

    // Создаем запись в проверке качества
    await this.prisma.qualityCheck.create({
      data: {
        productId: task.productId,
        checkedById: userId,
        status: 'REJECTED',
        notes,
        checkedAt: new Date(),
      },
    });

    // Запрашиваем фото брака у складиста, если нужно
    if (requestPhoto && user.telegramId) {
      this.logger.log(`Requesting ${rejectQuantity} defect photos from warehouse ${user.email}`);
      const photoRequested = await this.telegramService.requestDefectPhoto(
        userId,
        taskId,
        notes,
        rejectQuantity
      );

      if (photoRequested) {
        this.logger.log(`Photo request sent to warehouse ${user.email}`);
      } else {
        this.logger.warn(`Failed to request photo from warehouse ${user.email}`);
      }
    }

    // Определяем роль, которой вернуть брак
    let targetRoleCode = 'PAINTER'; // По умолчанию маляр
    let targetStageName = 'Покраска';

    if (returnToStage) {
      switch (returnToStage) {
        case ProductionStage.PENDING:
          targetRoleCode = 'MANAGER';
          targetStageName = 'Менеджер';
          break;
        case ProductionStage.DESIGN:
          targetRoleCode = 'DESIGNER';
          targetStageName = 'Проектирование';
          break;
        case ProductionStage.PREPARATION:
          targetRoleCode = 'PREPARER';
          targetStageName = 'Заготовка';
          break;
        case ProductionStage.PAINTING:
          targetRoleCode = 'PAINTER';
          targetStageName = 'Покраска';
          break;
        default:
          targetRoleCode = 'PAINTER';
          targetStageName = 'Покраска';
      }
    }

    // Отправляем уведомление работникам выбранной стадии о новом браке
    const targetWorkers = await this.prisma.user.findMany({
      where: {
        role: { code: targetRoleCode },
        isActive: true,
      },
    });

    if (targetWorkers.length > 0 && rejectQuantity > 0) {
      // Отправляем уведомление в Telegram работникам выбранной стадии (без создания задач)
      for (const worker of targetWorkers) {
        if (worker.telegramId) {
          const message = `🚨 *НОВЫЙ БРАК В СИСТЕМЕ*\n\n` +
            `*Продукт:* ${task.product.name}\n` +
            `*Тип:* ${task.product.productType?.name || 'Н/Д'}\n` +
            `*Заказ:* ${task.product.order?.orderNumber || 'Н/Д'}\n\n` +
            `*Причина брака:*\n${notes}\n\n` +
            `*Забраковал:* ${user.firstName} ${user.lastName}\n` +
            `*Количество брака:* ${rejectQuantity} шт.\n` +
            `*Вернуть на стадию:* ${targetStageName}\n\n` +
            `⚠️ Откройте раздел "Брак" в системе чтобы принять на доработку`;

          await this.telegramService.sendMessage(worker.telegramId, message);
        }
      }
    }

    this.logger.log('Task rejected successfully', { taskId });
    return updatedTask;
  }

  // Принять товар на склад (для складиста)
  async approveTask(taskId: string, userId: string, quantity: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, include: { role: true },
    });

    if (!user || user.role?.code !== 'WAREHOUSE') {
      throw new ForbiddenException('Только складист может принять товар');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
          }
        }
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    if (task.assignedToId !== userId) {
      throw new ForbiddenException('Вы не можете принять эту задачу');
    }

    if (task.stage !== ProductionStage.QUALITY_CHECK) {
      throw new BadRequestException('Принять можно только на стадии проверки качества');
    }

    // Обновляем задачу
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.PASSED,
        completedAt: new Date(),
        passedAt: new Date(),
        quantity,
      },
    });

    // Обновляем продукт
    await this.prisma.product.update({
      where: { id: task.productId },
      data: {
        stage: ProductionStage.COMPLETED,
        quantity,
      },
    });

    // Создаем запись в проверке качества
    await this.prisma.qualityCheck.create({
      data: {
        productId: task.productId,
        checkedById: userId,
        status: 'APPROVED',
        checkedAt: new Date(),
      },
    });

    // Создаем запись в журнале работ для расчета зарплаты складиста
    try {
      // Получаем workflow stage для QUALITY_CHECK
      const workflowStage = await this.prisma.workflowStage.findFirst({
        where: { legacyStage: ProductionStage.QUALITY_CHECK, isActive: true },
      });

      await this.payrollService.createWorkLog({
        userId,
        productId: task.productId,
        taskId: task.id,
        productTypeId: task.product.productTypeId,
        stage: ProductionStage.QUALITY_CHECK,
        workflowStageId: workflowStage?.id,
        quantity,
        completedAt: new Date(),
      });
      this.logger.log(`WorkLog created for warehouse user ${userId}, task ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to create WorkLog for warehouse task ${taskId}:`, error);
    }

    // Добавляем товар на склад (создаём или обновляем складской остаток)
    const existingInventory = await this.prisma.inventoryItem.findFirst({
      where: {
        productId: task.productId,
      },
    });

    if (existingInventory) {
      // Если товар уже есть на складе, увеличиваем количество
      await this.prisma.inventoryItem.update({
        where: { id: existingInventory.id },
        data: {
          quantity: existingInventory.quantity + quantity,
        },
      });
    } else {
      // Создаём новую запись складского остатка
      await this.prisma.inventoryItem.create({
        data: {
          name: task.product.name,
          quantity,
          productId: task.productId,
          productTypeId: task.product.productTypeId,
          orderId: task.product.orderId,
          notes: `Принято на склад из заказа ${task.product.order.orderNumber}`,
        },
      });
    }

    // Обновляем статус заказа
    await this.updateOrderStatus(task.product.orderId);

    return updatedTask;
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

    let newStatus = null;

    if (allCompleted && products.length > 0) {
      newStatus = 'COMPLETED';
    } else if (hasStarted) {
      newStatus = 'IN_PRODUCTION';
    }

    if (newStatus) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
    }
  }

  // Получить все браки (с фото и без)
  async getDefectsWithPhotos(userId?: string) {
    // Получаем информацию о пользователе
    let user = null;
    if (userId) {
      user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    }

    // Оптимизированный запрос: получаем rejected tasks с включёнными qualityChecks через product
    const rejectedTasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.REJECTED,
      },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
            qualityChecks: {
              where: {
                status: 'REJECTED',
              },
              include: {
                checkedBy: true,
              },
              orderBy: {
                checkedAt: 'desc',
              },
              take: 1, // Берём только последний rejected check
            },
          },
        },
        assignedTo: true,
      },
      orderBy: {
        rejectedAt: 'desc',
      },
    });

    // Преобразуем в нужный формат без дополнительных запросов
    const defects = rejectedTasks
      .filter(task => task.product.qualityChecks.length > 0)
      .map(task => {
        const qualityCheck = task.product.qualityChecks[0];
        return {
          ...qualityCheck,
          product: {
            ...task.product,
            qualityChecks: undefined, // Убираем дублирование
          },
          defectPhotos: task.defectPhotos,
        };
      });

    let filteredDefects = defects.filter((d) => d.id); // Убираем null значения

    // Владелец и менеджер видят все браки
    if (user && (user.role?.code === 'OWNER' || user.role?.code === 'MANAGER')) {
      return filteredDefects;
    }

    // Производственные рабочие видят только браки на своей стадии
    if (user) {
      let userStage: ProductionStage | null = null;

      switch (user.role?.code) {
        case 'DESIGNER':
          userStage = ProductionStage.DESIGN;
          break;
        case 'PREPARER':
          userStage = ProductionStage.PREPARATION;
          break;
        case 'PAINTER':
          userStage = ProductionStage.PAINTING;
          break;
        case 'SEWER':
          userStage = ProductionStage.SEWING;
          break;
        case 'WAREHOUSE':
          userStage = ProductionStage.QUALITY_CHECK;
          break;
        default:
          userStage = ProductionStage.PENDING;
      }

      // Фильтруем только браки на стадии пользователя
      filteredDefects = filteredDefects.filter((d) => d.product?.stage === userStage);
    }

    return filteredDefects;
  }

  // Принять брак на доработку (для любого работника)
  async acceptDefectRework(productId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, include: { role: true },
    });

    if (!user) {
      throw new ForbiddenException('Пользователь не найден');
    }

    // Определяем стадию на основе роли пользователя
    let userStage: ProductionStage;
    let stageName: string;

    switch (user.role?.code) {
      case 'MANAGER':
        userStage = ProductionStage.PENDING;
        stageName = 'ПРОВЕРКА (МЕНЕДЖЕР)';
        break;
      case 'DESIGNER':
        userStage = ProductionStage.DESIGN;
        stageName = 'ПРОЕКТИРОВАНИЕ';
        break;
      case 'PREPARER':
        userStage = ProductionStage.PREPARATION;
        stageName = 'ЗАГОТОВКА';
        break;
      case 'PAINTER':
        userStage = ProductionStage.PAINTING;
        stageName = 'ПОКРАСКА';
        break;
      case 'SEWER':
        userStage = ProductionStage.SEWING;
        stageName = 'ПОШИВ';
        break;
      default:
        throw new ForbiddenException('Ваша роль не может принимать браки на доработку');
    }

    // Проверяем, есть ли уже задача на этот продукт для этого работника
    const existingTask = await this.prisma.task.findFirst({
      where: {
        productId,
        assignedToId: userId,
        status: {
          in: [TaskStatus.NEW, TaskStatus.ACCEPTED],
        },
        stage: userStage,
      },
    });

    if (existingTask) {
      throw new BadRequestException('Вы уже приняли этот брак на доработку');
    }

    // Получаем информацию о продукте и забракованной задаче
    const rejectedTask = await this.prisma.task.findFirst({
      where: {
        productId,
        status: TaskStatus.REJECTED,
      },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
          },
        },
      },
      orderBy: {
        rejectedAt: 'desc',
      },
    });

    if (!rejectedTask) {
      throw new NotFoundException('Забракованная задача не найдена');
    }

    // Создаем новую задачу для работника
    const newTask = await this.prisma.task.create({
      data: {
        title: `${rejectedTask.product.name} - ${stageName} (БРАК)`,
        description: `Доработка после контроля качества. Причина: ${rejectedTask.notes}\n\n⚠️ Фото брака в разделе "Брак"`,
        stage: userStage,
        productId,
        assignedToId: userId,
        quantity: rejectedTask.quantity,
        status: TaskStatus.ACCEPTED, // Сразу принимаем
        acceptedAt: new Date(),
      },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
          },
        },
      },
    });

    this.logger.log(`User ${user.email} accepted defect rework for product ${productId}`);
    return newTask;
  }

  // Получить количество непринятых браков (для любого работника)
  async getUnacceptedDefectsCount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, include: { role: true },
    });

    if (!user) {
      return { count: 0 };
    }

    // Определяем стадию на основе роли пользователя
    let userStage: ProductionStage | null = null;

    switch (user.role?.code) {
      case 'MANAGER':
        userStage = ProductionStage.PENDING;
        break;
      case 'DESIGNER':
        userStage = ProductionStage.DESIGN;
        break;
      case 'PREPARER':
        userStage = ProductionStage.PREPARATION;
        break;
      case 'PAINTER':
        userStage = ProductionStage.PAINTING;
        break;
      case 'SEWER':
        userStage = ProductionStage.SEWING;
        break;
      default:
        // Для OWNER, WAREHOUSE и других - показываем все браки
        const allDefects = await this.prisma.task.findMany({
          where: {
            status: TaskStatus.REJECTED,
          },
        });
        return { count: allDefects.length };
    }

    // Оптимизированный запрос: получаем все уникальные productId из rejected tasks
    const rejectedTasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.REJECTED,
      },
      select: {
        productId: true,
      },
      distinct: ['productId'],
    });

    if (rejectedTasks.length === 0) {
      return { count: 0 };
    }

    const rejectedProductIds = rejectedTasks.map(t => t.productId);

    // Одним запросом получаем все активные задачи пользователя на этих продуктах
    const userActiveTasks = await this.prisma.task.findMany({
      where: {
        productId: { in: rejectedProductIds },
        assignedToId: userId,
        status: { in: [TaskStatus.NEW, TaskStatus.ACCEPTED] },
        stage: userStage,
      },
      select: {
        productId: true,
      },
    });

    // Считаем количество продуктов без активных задач
    const acceptedProductIds = new Set(userActiveTasks.map(t => t.productId));
    const unacceptedCount = rejectedProductIds.filter(id => !acceptedProductIds.has(id)).length;

    return { count: unacceptedCount };
  }
}
