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

    // Проверяем, является ли это "учёткой отдела" (видит все задачи отдела)
    const isDepartmentAccount = user.isDepartmentAccount === true ||
      user.email?.endsWith('@example.com') || user.email?.endsWith('@factory.com');

    // Для работников возвращаем задачи на их стадии, отсортированные по приоритету
    // Для учёток отдела - все задачи стадии, для обычных работников - только их задачи
    const tasks = await this.prisma.task.findMany({
      where: {
        ...(isDepartmentAccount ? {} : { assignedToId: userId }), // Учётка отдела видит все
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
    return tasks.filter(task => task.product?.stage === task.stage);
  }

  // Получить задачи всего отдела (для координации работы)
  async getDepartmentTasks(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
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
      return [];
    }

    // Получаем всех работников отдела
    const departmentWorkers = await this.prisma.user.findMany({
      where: {
        roleId: user.roleId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Получаем принятые задачи (ACCEPTED) для всех работников отдела на текущей стадии
    const tasks = await this.prisma.task.findMany({
      where: {
        assignedToId: { in: departmentWorkers.map(w => w.id) },
        stage: stage,
        status: TaskStatus.ACCEPTED,
      },
      include: {
        product: {
          include: {
            productType: true,
            order: {
              select: {
                id: true,
                orderNumber: true,
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
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { acceptedAt: 'desc' },
      ],
    });

    // Фильтруем только актуальные задачи
    const filteredTasks = tasks.filter(task => task.product?.stage === task.stage);

    // Группируем по сотрудникам
    const tasksByWorker = new Map<string, typeof filteredTasks>();

    for (const task of filteredTasks) {
      const workerId = task.assignedToId;
      if (!tasksByWorker.has(workerId)) {
        tasksByWorker.set(workerId, []);
      }
      tasksByWorker.get(workerId)!.push(task);
    }

    // Формируем результат с информацией о работниках
    const result = departmentWorkers.map(worker => ({
      worker: {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        isCurrentUser: worker.id === userId,
      },
      tasks: tasksByWorker.get(worker.id) || [],
    })).filter(item => item.tasks.length > 0); // Показываем только тех, у кого есть задачи

    return result;
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
  async acceptTask(taskId: string, workerId: string, requesterId?: string, acceptQuantity?: number) {
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

    // Для задач с браком - только назначенный работник может принять
    const isDefectTask = task.title?.includes('БРАК');
    if (isDefectTask && task.assignedToId !== workerId) {
      throw new ForbiddenException('Задача брака может быть принята только назначенным работником');
    }

    // Определяем количество для принятия
    const taskQuantity = task.quantity || task.product?.quantity || 1;
    const quantityToAccept = acceptQuantity && acceptQuantity > 0 && acceptQuantity < taskQuantity
      ? acceptQuantity
      : taskQuantity;
    const remainingQuantity = taskQuantity - quantityToAccept;

    // Удаляем копии этой задачи у других работников той же роли (только для обычных задач)
    if (!isDefectTask) {
      await this.prisma.task.deleteMany({
        where: {
          productId: task.productId,
          stage: task.stage,
          status: TaskStatus.NEW,
          id: { not: taskId }, // Все кроме текущей
        },
      });
    }

    // Если есть остаток - создаём новые задачи для всех работников отдела
    if (remainingQuantity > 0 && !isDefectTask) {
      // Получаем всех работников этого отдела
      const departmentWorkers = await this.prisma.user.findMany({
        where: { roleId: worker.roleId },
      });

      // Создаём задачи для оставшегося количества
      for (const deptWorker of departmentWorkers) {
        await this.prisma.task.create({
          data: {
            title: task.title,
            stage: task.stage,
            quantity: remainingQuantity,
            productId: task.productId,
            assignedToId: deptWorker.id,
            priority: task.priority,
          },
        });
      }
    }

    // Обновляем задачу и назначаем выбранному работнику
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.ACCEPTED,
        acceptedAt: new Date(),
        assignedToId: workerId,
        quantity: quantityToAccept, // Устанавливаем принятое количество
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
    // Используем транзакцию для атомарности операции
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          product: true,
          assignedTo: { include: { role: true } },
        },
      });

      if (!task) {
        throw new NotFoundException('Задача не найдена');
      }

      // Проверяем, что пользователь из того же отдела (та же роль)
      if (task.assignedToId !== userId) {
        const currentUser = await tx.user.findUnique({
          where: { id: userId },
          include: { role: true },
        });

        if (!currentUser || currentUser.roleId !== task.assignedTo?.roleId) {
          throw new ForbiddenException('Вы не можете завершить эту задачу - вы не из этого отдела');
        }
      }

      if (task.status !== TaskStatus.ACCEPTED) {
        throw new BadRequestException('Задача должна быть сначала принята в работу');
      }

      // Если количество не указано, используем количество из задачи
      const completedQuantity = quantity || task.quantity;
      const remainingQuantity = task.quantity - completedQuantity;

      // Если завершено меньше чем нужно, создаем новую задачу с остатком
      if (remainingQuantity > 0) {
        await tx.task.create({
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

      return tx.task.update({
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
    });
  }

  // Передать задачу дальше (следующей роли)
  async passTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        product: { include: { productType: true } },
        assignedTo: { include: { role: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    // Проверяем, что пользователь из того же отдела (та же роль)
    if (task.assignedToId !== userId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!currentUser || currentUser.roleId !== task.assignedTo?.roleId) {
        throw new ForbiddenException('Вы не можете передать эту задачу - вы не из этого отдела');
      }
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

    // WorkLog НЕ создаётся здесь - оплата начисляется только когда склад принимает изделие
    // См. метод approveTask

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
    const nextStageRoleIds = nextWorkflowStage.roles?.map(r => r.roleId) || [];

    if (nextStageRoleIds.length === 0) {
      this.logger.warn(`No roles assigned to workflow stage ${nextWorkflowStage.name}`);
    }

    const nextWorkers = await this.prisma.user.findMany({
      where: {
        roleId: { in: nextStageRoleIds },
        isActive: true,
      },
      include: { role: true },
    });

    if (nextWorkers.length === 0) {
      this.logger.warn(`No active workers found for stage ${nextWorkflowStage.name}. Product ${task.product.name} moved but no tasks created.`);
    }

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

    // Учётки отдела могут браковать любые задачи своей стадии
    const isDepartmentAccount = user.isDepartmentAccount === true ||
      user.email?.endsWith('@example.com') || user.email?.endsWith('@factory.com');

    if (task.assignedToId !== userId && !isDepartmentAccount) {
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

    // Определяем стадию возврата
    let returnStage: ProductionStage = ProductionStage.PAINTING;
    if (returnToStage && Object.values(ProductionStage).includes(returnToStage as ProductionStage)) {
      returnStage = returnToStage as ProductionStage;
    }

    // Возвращаем ТОЛЬКО забракованное количество продукта на выбранную стадию
    // Если это частичный брак, создаем новый продукт
    let rejectedProductId = task.productId;

    if (rejectQuantity < task.product.quantity) {
      // Частичный брак - создаем новый продукт для брака
      const rejectedProduct = await this.prisma.product.create({
        data: {
          name: `${task.product.name} (БРАК ${rejectQuantity} шт.)`,
          productTypeId: task.product.productTypeId,
          quantity: rejectQuantity,
          stage: returnStage,
          orderId: task.product.orderId,
          dimensions: task.product.dimensions,
          schemaImageUrl: task.product.schemaImageUrl,
          deadline: task.product.deadline,
          requiresSewing: task.product.requiresSewing,
          upholsteryMaterial: task.product.upholsteryMaterial,
        },
      });
      rejectedProductId = rejectedProduct.id;
    } else {
      // Полный брак - возвращаем весь продукт
      await this.prisma.product.update({
        where: { id: task.productId },
        data: {
          stage: returnStage,
        },
      });
    }

    // Обновляем статус заказа
    await this.updateOrderStatus(task.product.orderId);

    // Создаем запись в проверке качества для отклоненного продукта
    await this.prisma.qualityCheck.create({
      data: {
        productId: rejectedProductId,
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

    // Определяем название стадии для уведомления
    let targetStageName = 'Покраска';
    switch (returnStage) {
      case ProductionStage.PENDING:
        targetStageName = 'Менеджер';
        break;
      case ProductionStage.DESIGN:
        targetStageName = 'Проектирование';
        break;
      case ProductionStage.PREPARATION:
        targetStageName = 'Заготовка';
        break;
      case ProductionStage.ASSEMBLY:
        targetStageName = 'Сборка';
        break;
      case ProductionStage.PAINTING:
        targetStageName = 'Покраска';
        break;
      case ProductionStage.SEWING:
        targetStageName = 'Пошив';
        break;
      default:
        targetStageName = 'Покраска';
    }

    // Ищем КОНКРЕТНОГО работника, который работал над этим изделием на указанной стадии
    const originalTask = await this.prisma.task.findFirst({
      where: {
        productId: task.productId,
        stage: returnStage,
        status: TaskStatus.PASSED, // Работник, который завершил и передал задачу
      },
      include: {
        assignedTo: true,
      },
      orderBy: {
        passedAt: 'desc', // Берём последнего, кто работал
      },
    });

    if (originalTask && originalTask.assignedTo) {
      const originalWorker = originalTask.assignedTo;

      // Создаём задачу ТОЛЬКО для конкретного работника, который делал эту работу
      const defectTask = await this.prisma.task.create({
        data: {
          title: `${task.product.name} - ${targetStageName} (БРАК)`,
          description: `Доработка после контроля качества.\n\nПричина брака: ${notes}\n\nЗабраковал: ${user.firstName} ${user.lastName}`,
          stage: returnStage,
          productId: rejectedProductId,
          assignedToId: originalWorker.id,
          quantity: rejectQuantity,
          status: TaskStatus.NEW,
        },
      });

      this.logger.log(`Defect task ${defectTask.id} created for original worker ${originalWorker.email} (${originalWorker.firstName} ${originalWorker.lastName})`);

      // Отправляем уведомление ТОЛЬКО этому работнику
      if (originalWorker.telegramId) {
        const message = `🚨 *БРАК - ТРЕБУЕТСЯ ДОРАБОТКА*\n\n` +
          `*Продукт:* ${task.product.name}\n` +
          `*Тип:* ${task.product.productType?.name || 'Н/Д'}\n` +
          `*Заказ:* ${task.product.order?.orderNumber || 'Н/Д'}\n\n` +
          `*Причина брака:*\n${notes}\n\n` +
          `*Забраковал:* ${user.firstName} ${user.lastName}\n` +
          `*Количество:* ${rejectQuantity} шт.\n` +
          `*Стадия:* ${targetStageName}\n\n` +
          `⚠️ Задача уже назначена вам. Откройте раздел "Мои задачи"`;

        await this.telegramService.sendMessage(originalWorker.telegramId, message);
      }
    } else {
      // Если не нашли конкретного работника, логируем предупреждение
      this.logger.warn(`Could not find original worker for product ${task.productId} at stage ${returnStage}. No task created.`);
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

    // Проверяем статус задачи — принять можно только NEW или PASSED задачи
    if (task.status !== TaskStatus.NEW && task.status !== TaskStatus.PASSED) {
      throw new BadRequestException(`Нельзя принять задачу в статусе "${task.status}"`);
    }

    // Учётки отдела (isDepartmentAccount) могут принимать любые задачи своей стадии
    const isDepartmentAccount = user.isDepartmentAccount === true ||
      user.email?.endsWith('@example.com') || user.email?.endsWith('@factory.com');

    if (task.assignedToId !== userId && !isDepartmentAccount) {
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

    // Создаем записи в журнале работ для ВСЕХ работников, кто работал над этим изделием
    // Оплата начисляется только когда склад принимает готовое изделие
    try {
      // Используем прямую связь Product → Nomenclature (по FK)
      const nomenclatureId = task.product.nomenclatureId || null;
      const nomenclature = nomenclatureId
        ? await this.prisma.nomenclature.findUnique({ where: { id: nomenclatureId } })
        : null;

      // Получаем все PASSED задачи для этого продукта (работники, которые завершили работу)
      const passedTasks = await this.prisma.task.findMany({
        where: {
          productId: task.productId,
          status: TaskStatus.PASSED,
          stage: { not: ProductionStage.QUALITY_CHECK }, // Исключаем склад, его добавим отдельно
        },
        include: {
          assignedTo: true,
        },
      });

      // Создаём work_log для каждого работника, кто работал над изделием
      for (const passedTask of passedTasks) {
        // Проверяем, не создан ли уже work_log для этой задачи
        const existingLog = await this.prisma.workLog.findFirst({
          where: { taskId: passedTask.id },
        });

        if (!existingLog) {
          const workflowStage = await this.prisma.workflowStage.findFirst({
            where: { legacyStage: passedTask.stage, isActive: true },
          });

          await this.payrollService.createWorkLog({
            userId: passedTask.assignedToId,
            productId: task.productId,
            taskId: passedTask.id,
            productTypeId: task.product.productTypeId,
            nomenclatureId: nomenclature?.id,
            stage: passedTask.stage,
            workflowStageId: workflowStage?.id,
            quantity: passedTask.quantity,
            completedAt: passedTask.passedAt || new Date(),
            notes: passedTask.notes || undefined,
          });
          this.logger.log(`WorkLog created for worker ${passedTask.assignedToId}, task ${passedTask.id}, stage ${passedTask.stage}`);
        }
      }

      // Складисты не получают сдельную оплату - work_log не создаётся
    } catch (error) {
      this.logger.error(`Failed to create WorkLogs for product ${task.productId}:`, error);
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

    // Владелец, супер-админ и менеджер видят все браки
    if (user && (user.role?.code === 'OWNER' || user.role?.code === 'SUPER_ADMIN' || user.role?.code === 'MANAGER')) {
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
        case 'ASSEMBLER':
          userStage = ProductionStage.ASSEMBLY;
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
      case 'ASSEMBLER':
        userStage = ProductionStage.ASSEMBLY;
        stageName = 'СБОРКА';
        break;
      case 'WAREHOUSE':
        userStage = ProductionStage.QUALITY_CHECK;
        stageName = 'ПРОВЕРКА КАЧЕСТВА';
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

    // Получаем rejected tasks с информацией о продукте, фильтруем по стадии продукта
    const rejectedTasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.REJECTED,
        product: {
          stage: userStage, // Только продукты на стадии пользователя
        },
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
