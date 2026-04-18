import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramService } from "../telegram/telegram.service";
import { PayrollService } from "../payroll/payroll.service";
import { TaskStatus, ProductionStage } from "@prisma/client";
import {
  ROLE_TO_STAGE,
  STAGE_TO_NAME,
  isDepartmentAccount,
} from "../common/constants";
import { NotificationsGateway } from "../notifications/notifications.gateway";

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private payrollService: PayrollService,
    private notifications: NotificationsGateway,
  ) {}

  // Получить задачи текущего пользователя
  async getMyTasks(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    const roleCode = user.role?.code;
    const stage = roleCode ? ROLE_TO_STAGE[roleCode] : undefined;

    if (!stage) {
      // Для MANAGER возвращаем пустой массив - у них нет производственных задач
      // Менеджеры работают с заказами с сайта через отдельную страницу /catalog-orders
      if (roleCode === "MANAGER") {
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
          { priority: "desc" }, // Сначала по приоритету задачи
          { createdAt: "desc" }, // Потом по дате создания
        ],
      });
    }

    // Для работников возвращаем задачи на их стадии, отсортированные по приоритету
    // Для учёток отдела - все задачи стадии, для обычных работников - только их задачи
    const isDeptAccount = isDepartmentAccount(user);
    const tasks = await this.prisma.task.findMany({
      where: {
        ...(isDeptAccount ? {} : { assignedToId: userId }), // Учётка отдела видит все
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
        { priority: "desc" }, // Сначала по приоритету задачи (URGENT > HIGH > NORMAL > LOW)
        { createdAt: "desc" }, // Потом по дате создания
      ],
    });

    // Фильтруем только актуальные задачи, где этап задачи совпадает с текущим этапом продукта
    const activeTasks = tasks.filter(
      (task) => task.product?.stage === task.stage,
    );

    // Для учёток отдела: группируем по продукту, показываем одну задачу на продукт
    // Приоритет: задача самого отдела > задача принятая кем-то > задача другого работника
    if (isDeptAccount) {
      const tasksByProduct = new Map<string, (typeof activeTasks)[0]>();
      for (const task of activeTasks) {
        const productId = task.productId;
        const existing = tasksByProduct.get(productId);
        if (!existing) {
          tasksByProduct.set(productId, task);
        } else {
          // Приоритет: своя задача > чужая
          const isOwnTask = task.assignedToId === userId;
          const isExistingOwn = existing.assignedToId === userId;
          if (isOwnTask && !isExistingOwn) {
            tasksByProduct.set(productId, task);
          }
        }
      }
      return Array.from(tasksByProduct.values());
    }

    return activeTasks;
  }

  // Получить задачи всего отдела (для координации работы)
  async getDepartmentTasks(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    const roleCode = user.role?.code;
    const stage = roleCode ? ROLE_TO_STAGE[roleCode] : undefined;

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
        assignedToId: { in: departmentWorkers.map((w) => w.id) },
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
      orderBy: [{ priority: "desc" }, { acceptedAt: "desc" }],
    });

    // Фильтруем только актуальные задачи
    const filteredTasks = tasks.filter(
      (task) => task.product?.stage === task.stage,
    );

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
    const result = departmentWorkers
      .map((worker) => ({
        worker: {
          id: worker.id,
          firstName: worker.firstName,
          lastName: worker.lastName,
          isCurrentUser: worker.id === userId,
        },
        tasks: tasksByWorker.get(worker.id) || [],
      }))
      .filter((item) => item.tasks.length > 0); // Показываем только тех, у кого есть задачи

    return result;
  }

  // Получить сотрудников своего отдела (той же роли)
  async getDepartmentWorkers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
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
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  // Принять задачу в работу
  async acceptTask(
    taskId: string,
    workerId: string,
    requesterId?: string,
    acceptQuantity?: number,
  ) {
    // Валидация количества
    if (acceptQuantity !== undefined && acceptQuantity !== null) {
      if (!Number.isFinite(acceptQuantity) || acceptQuantity <= 0) {
        throw new BadRequestException(
          "Количество должно быть положительным числом",
        );
      }
    }

    // Предварительные проверки вне транзакции (быстрый отказ)
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
      include: { role: true },
    });

    if (!worker) {
      throw new NotFoundException("Работник не найден");
    }

    if (requesterId && requesterId !== workerId) {
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { role: true },
      });
      if (!requester || requester.roleId !== worker.roleId) {
        throw new ForbiddenException(
          "Вы не можете назначить задачу работнику из другого отдела",
        );
      }
    }

    // Атомарная транзакция для предотвращения race condition
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          product: true,
          assignedTo: { include: { role: true } },
        },
      });

      if (!task) {
        throw new NotFoundException("Задача не найдена");
      }

      if (task.status !== TaskStatus.NEW) {
        throw new BadRequestException("Задача уже принята или завершена");
      }

      // Проверяем что выбранный работник из того же отдела (та же роль)
      if (task.assignedTo?.roleId !== worker.roleId) {
        throw new ForbiddenException("Работник не из этого отдела");
      }

      // Для задач с браком — только назначенный работник может принять.
      // Поле isDefect — авторитетный источник; title.includes оставлен как fallback
      // для задач, созданных до миграции 20260418230100_add_task_is_defect.
      const isDefectTask = task.isDefect || !!task.title?.includes("БРАК");
      if (isDefectTask && task.assignedToId !== workerId) {
        throw new ForbiddenException(
          "Задача брака может быть принята только назначенным работником",
        );
      }

      // Определяем количество для принятия
      const taskQuantity = task.quantity || task.product?.quantity || 1;

      if (acceptQuantity && acceptQuantity > taskQuantity) {
        throw new BadRequestException(
          `Нельзя принять ${acceptQuantity} шт. Доступно только ${taskQuantity} шт.`,
        );
      }

      const quantityToAccept =
        acceptQuantity && acceptQuantity > 0 && acceptQuantity < taskQuantity
          ? acceptQuantity
          : taskQuantity;
      const remainingQuantity = taskQuantity - quantityToAccept;

      // Удаляем копии этой задачи у других работников той же роли (только для обычных задач)
      if (!isDefectTask) {
        await tx.task.deleteMany({
          where: {
            productId: task.productId,
            stage: task.stage,
            status: TaskStatus.NEW,
            id: { not: taskId },
          },
        });
      }

      // Если есть остаток - создаём новые задачи для всех работников отдела
      if (remainingQuantity > 0 && !isDefectTask) {
        const departmentWorkers = await tx.user.findMany({
          where: { roleId: worker.roleId },
        });

        for (const deptWorker of departmentWorkers) {
          await tx.task.create({
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
      return tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.ACCEPTED,
          acceptedAt: new Date(),
          assignedToId: workerId,
          quantity: quantityToAccept,
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

  // Завершить задачу
  async completeTask(
    taskId: string,
    userId: string,
    notes?: string,
    quantity?: number,
  ) {
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
        throw new NotFoundException("Задача не найдена");
      }

      // Проверяем, что пользователь из того же отдела (та же роль)
      if (task.assignedToId !== userId) {
        const currentUser = await tx.user.findUnique({
          where: { id: userId },
          include: { role: true },
        });

        if (!currentUser || currentUser.roleId !== task.assignedTo?.roleId) {
          throw new ForbiddenException(
            "Вы не можете завершить эту задачу - вы не из этого отдела",
          );
        }
      }

      if (task.status !== TaskStatus.ACCEPTED) {
        throw new BadRequestException(
          "Задача должна быть сначала принята в работу",
        );
      }

      // Валидация количества
      if (quantity !== undefined && quantity !== null) {
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new BadRequestException(
            "Количество должно быть положительным числом",
          );
        }
        if (quantity > task.quantity) {
          throw new BadRequestException(
            `Нельзя завершить ${quantity} шт. В задаче только ${task.quantity} шт.`,
          );
        }
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
      throw new NotFoundException("Задача не найдена");
    }

    // Проверяем, что пользователь из того же отдела (та же роль)
    if (task.assignedToId !== userId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!currentUser || currentUser.roleId !== task.assignedTo?.roleId) {
        throw new ForbiddenException(
          "Вы не можете передать эту задачу - вы не из этого отдела",
        );
      }
    }

    if (task.status !== TaskStatus.COMPLETED) {
      throw new BadRequestException("Задача должна быть сначала завершена");
    }

    // Получаем текущую стадию workflow
    const currentWorkflowStage = await this.prisma.workflowStage.findFirst({
      where: {
        legacyStage: task.stage,
        isActive: true,
      },
    });

    if (!currentWorkflowStage) {
      throw new BadRequestException("Текущая стадия workflow не найдена");
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
      throw new BadRequestException("Следующая стадия workflow не найдена");
    }

    // Пропускаем этап SEWING если продукт не требует пошива
    // Приоритет: upholsteryMaterial > product.requiresSewing > productType.requiresSewing
    // Если указан материал обшивки - пошив обязателен
    const product = task.product;
    const productType = product.productType;
    const needsSewing = product.upholsteryMaterial
      ? true // Если указан материал обшивки - пошив обязателен
      : product.requiresSewing !== null
        ? product.requiresSewing
        : (productType?.requiresSewing ?? false);

    if (
      nextWorkflowStage.legacyStage === ProductionStage.SEWING &&
      !needsSewing
    ) {
      this.logger.log(
        `Skipping SEWING stage for product ${product.name} - requiresSewing is false`,
      );
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

    // Атомарная транзакция: обновляем задачу, историю и стадию продукта
    const updatedTask = await this.prisma.$transaction(async (tx) => {
      // Обновляем задачу
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.PASSED,
          passedAt: new Date(),
        },
      });

      // Создаем запись в истории
      await tx.productHistory.create({
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
      await tx.product.update({
        where: { id: task.productId },
        data: {
          stage: nextWorkflowStage.legacyStage!,
        },
      });

      return updated;
    });

    // Обновляем статус заказа (вне транзакции — не критично)
    await this.updateOrderStatus(task.product.orderId);

    // Создаем новые задачи для всех работников следующей стадии
    const nextStageRoleIds =
      nextWorkflowStage.roles?.map((r) => r.roleId) || [];

    if (nextStageRoleIds.length === 0) {
      this.logger.warn(
        `No roles assigned to workflow stage ${nextWorkflowStage.name}`,
      );
    }

    const nextWorkers = await this.prisma.user.findMany({
      where: {
        roleId: { in: nextStageRoleIds },
        isActive: true,
      },
      include: { role: true },
    });

    if (nextWorkers.length === 0) {
      this.logger.warn(
        `No active workers found for stage ${nextWorkflowStage.name}. Product ${task.product.name} moved but no tasks created.`,
      );
    }

    // Проверяем назначения работников из stageAssignments продукта
    const stageAssignments = (task.product as any).stageAssignments as Record<
      string,
      string
    > | null;
    const assignedId =
      stageAssignments && nextWorkflowStage.legacyStage
        ? stageAssignments[nextWorkflowStage.legacyStage]
        : undefined;
    const filteredWorkers = assignedId
      ? nextWorkers.filter((w) => w.id === assignedId)
      : nextWorkers;

    // Создаем задачу для каждого работника (общий цех) с переданным количеством
    for (const worker of filteredWorkers) {
      const newTask = await this.prisma.task.create({
        data: {
          title: `${task.product.name} - ${nextWorkflowStage.name}`,
          description: `Количество: ${completedQuantity} шт.`,
          stage: nextWorkflowStage.legacyStage!,
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
          `*Продукт:* ${(newTask as any).product?.name || "Н/Д"}\n` +
          `*Тип:* ${(newTask as any).product?.productType?.name || "Н/Д"}\n` +
          `*Количество:* ${completedQuantity} шт.\n` +
          `*Стадия:* ${nextWorkflowStage.name}\n` +
          `*Заказ:* ${(newTask as any).product?.order?.orderNumber || "Н/Д"}\n\n` +
          `✅ Откройте раздел "Мои задачи" для выполнения`;

        try {
          await this.telegramService.sendMessage(worker.telegramId, message);
          this.logger.log(`Уведомление отправлено работнику ${worker.email}`);
        } catch (error) {
          this.logger.error(
            `Ошибка отправки уведомления работнику ${worker.email}:`,
            error,
          );
        }
      }
    }

    return updatedTask;
  }

  // Забраковать задачу (только для складиста)
  async rejectTask(
    taskId: string,
    userId: string,
    notes: string,
    quantity?: number,
    defectPhotoUrl?: string,
    requestPhoto?: boolean,
    returnToStage?: string,
    penaltyAmount?: number,
  ) {
    this.logger.debug("rejectTask called", {
      taskId,
      userId,
      notes,
      quantity,
      defectPhotoUrl,
      requestPhoto,
      returnToStage,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    this.logger.debug("User found", {
      email: user?.email,
      role: user?.role?.code,
    });

    if (!user || user.role?.code !== "WAREHOUSE") {
      this.logger.warn("Attempted reject by non-warehouse user", { userId });
      throw new ForbiddenException("Только складист может браковать товар");
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
          },
        },
      },
    });

    this.logger.debug("Task found", {
      title: task?.title,
      status: task?.status,
      stage: task?.stage,
    });

    if (!task) {
      this.logger.warn("Task not found", { taskId });
      throw new NotFoundException("Задача не найдена");
    }

    if (task.assignedToId !== userId && !isDepartmentAccount(user)) {
      this.logger.warn("Task not assigned to user", { taskId, userId });
      throw new ForbiddenException("Вы не можете забраковать эту задачу");
    }

    if (task.stage !== ProductionStage.QUALITY_CHECK) {
      this.logger.warn("Task not at QUALITY_CHECK stage", {
        taskId,
        stage: task.stage,
      });
      throw new BadRequestException(
        "Браковать можно только на стадии проверки качества",
      );
    }

    this.logger.debug("All validations passed, proceeding with rejection");

    // Валидация количества
    if (quantity !== undefined && quantity !== null) {
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(
          "Количество должно быть положительным числом",
        );
      }
    }

    // Проверяем доступное количество для брака
    const availableQuantity = task.quantity - task.quantityProcessed;
    const rejectQuantity = quantity || availableQuantity;

    if (rejectQuantity > availableQuantity) {
      throw new BadRequestException(
        `Нельзя забраковать ${rejectQuantity} шт. Доступно только ${availableQuantity} шт.`,
      );
    }

    this.logger.debug(
      `Rejecting ${rejectQuantity} out of ${availableQuantity} available (total: ${task.quantity})`,
    );

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

    // Определяем стадию возврата — динамически из WorkflowStage
    let returnStage: ProductionStage;
    if (
      returnToStage &&
      Object.values(ProductionStage).includes(returnToStage as ProductionStage)
    ) {
      returnStage = returnToStage as ProductionStage;
    } else {
      // По умолчанию — предыдущий этап из workflow, пропускаем SEWING если продукт не требует пошива
      const currentWorkflowStage = await this.prisma.workflowStage.findFirst({
        where: { legacyStage: task.stage, isActive: true },
      });

      // Определяем, нужен ли пошив для продукта
      const productForSewing = task.product;
      const productTypeForSewing = (productForSewing as any).productType;
      const needsSewing = productForSewing.upholsteryMaterial
        ? true
        : productForSewing.requiresSewing !== null
          ? productForSewing.requiresSewing
          : (productTypeForSewing?.requiresSewing ?? false);

      let previousStage = currentWorkflowStage
        ? await this.prisma.workflowStage.findFirst({
            where: {
              order: { lt: currentWorkflowStage.order },
              isActive: true,
            },
            orderBy: { order: "desc" },
          })
        : null;

      // Если предыдущий этап SEWING и продукт не требует пошива — пропускаем его
      if (
        previousStage?.legacyStage === ProductionStage.SEWING &&
        !needsSewing
      ) {
        this.logger.log(
          `Skipping SEWING stage for return (product does not require sewing)`,
        );
        previousStage = await this.prisma.workflowStage.findFirst({
          where: { order: { lt: previousStage.order }, isActive: true },
          orderBy: { order: "desc" },
        });
      }

      returnStage =
        (previousStage?.legacyStage as ProductionStage) ||
        ProductionStage.PAINTING;
    }

    // Перепроверяем актуальное состояние продукта перед изменением стадии
    const currentProduct = await this.prisma.product.findUnique({
      where: { id: task.productId },
      select: { stage: true },
    });

    if (
      !currentProduct ||
      currentProduct.stage !== ProductionStage.QUALITY_CHECK
    ) {
      this.logger.warn("Product stage changed during reject processing", {
        taskId,
        expectedStage: ProductionStage.QUALITY_CHECK,
        actualStage: currentProduct?.stage,
      });
      throw new BadRequestException(
        "Продукт уже перемещён на другую стадию. Повторите операцию.",
      );
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
        status: "REJECTED",
        notes,
        checkedAt: new Date(),
      },
    });

    // Запрашиваем фото брака у складиста, если нужно
    if (requestPhoto && user.telegramId) {
      this.logger.log(
        `Requesting ${rejectQuantity} defect photos from warehouse ${user.email}`,
      );
      const photoRequested = await this.telegramService.requestDefectPhoto(
        userId,
        taskId,
        notes,
        rejectQuantity,
      );

      if (photoRequested) {
        this.logger.log(`Photo request sent to warehouse ${user.email}`);
      } else {
        this.logger.warn(
          `Failed to request photo from warehouse ${user.email}`,
        );
      }
    }

    const targetStageName = STAGE_TO_NAME[returnStage] || "Покраска";

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
        passedAt: "desc", // Берём последнего, кто работал
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
          isDefect: true,
        },
      });

      this.logger.log(
        `Defect task ${defectTask.id} created for original worker ${originalWorker.email} (${originalWorker.firstName} ${originalWorker.lastName})`,
      );

      // Отправляем уведомление ТОЛЬКО этому работнику
      if (originalWorker.telegramId) {
        const message =
          `🚨 *БРАК - ТРЕБУЕТСЯ ДОРАБОТКА*\n\n` +
          `*Продукт:* ${task.product.name}\n` +
          `*Тип:* ${task.product.productType?.name || "Н/Д"}\n` +
          `*Заказ:* ${task.product.order?.orderNumber || "Н/Д"}\n\n` +
          `*Причина брака:*\n${notes}\n\n` +
          `*Забраковал:* ${user.firstName} ${user.lastName}\n` +
          `*Количество:* ${rejectQuantity} шт.\n` +
          `*Стадия:* ${targetStageName}\n\n` +
          `⚠️ Задача уже назначена вам. Откройте раздел "Мои задачи"`;

        await this.telegramService.sendMessage(
          originalWorker.telegramId,
          message,
        );
      }
    } else {
      // Не нашли конкретного работника — назначаем любому доступному работнику этой стадии
      this.logger.warn(
        `Could not find original worker for product ${task.productId} at stage ${returnStage}. Searching for any available worker.`,
      );

      const stageRoleCode = Object.entries(ROLE_TO_STAGE).find(
        ([, stage]) => stage === returnStage,
      )?.[0];
      if (stageRoleCode) {
        const availableWorkers = await this.prisma.user.findMany({
          where: {
            role: { code: stageRoleCode },
            isActive: true,
          },
        });

        if (availableWorkers.length > 0) {
          // Создаём задачу для всех работников этой стадии (как обычную задачу)
          for (const worker of availableWorkers) {
            await this.prisma.task.create({
              data: {
                title: `${task.product.name} - ${targetStageName} (БРАК)`,
                description: `Доработка после контроля качества.\n\nПричина брака: ${notes}\n\nЗабраковал: ${user.firstName} ${user.lastName}`,
                stage: returnStage,
                productId: rejectedProductId,
                assignedToId: worker.id,
                quantity: rejectQuantity,
                status: TaskStatus.NEW,
                isDefect: true,
              },
            });
          }
          this.logger.log(
            `Defect tasks created for ${availableWorkers.length} workers at stage ${returnStage}`,
          );
        } else {
          this.logger.error(
            `No active workers found for stage ${returnStage}. Product ${task.productId} stuck without task!`,
          );
        }
      } else {
        this.logger.error(
          `No role mapping found for stage ${returnStage}. Product ${task.productId} stuck without task!`,
        );
      }
    }

    // Создаём штраф если указана сумма
    if (penaltyAmount && penaltyAmount > 0) {
      try {
        // Находим предыдущего исполнителя
        const lastHistory = await this.prisma.productHistory.findFirst({
          where: {
            productId: task.productId,
            completedAt: { not: null },
          },
          orderBy: { completedAt: "desc" },
          select: { userId: true },
        });

        const penaltyUserId = lastHistory?.userId;

        if (penaltyUserId) {
          await this.prisma.penalty.create({
            data: {
              userId: penaltyUserId,
              amount: penaltyAmount,
              reason: notes || "Брак на контроле качества",
              productId: task.productId,
              createdById: userId,
            },
          });

          // Telegram уведомление
          const checkerName = user
            ? `${user.lastName || ""} ${user.firstName || ""}`.trim()
            : "Склад";
          await this.telegramService.sendPenaltyNotification({
            userId: penaltyUserId,
            amount: penaltyAmount,
            reason: notes || "Брак на контроле качества",
            createdByName: checkerName,
          });

          this.logger.log("Penalty created during task rejection", {
            penaltyUserId,
            penaltyAmount,
          });
        }
      } catch (error) {
        this.logger.error("Failed to create penalty during rejection", error);
      }
    }

    this.logger.log("Task rejected successfully", { taskId });
    return updatedTask;
  }

  // Принять товар на склад (для складиста)
  async approveTask(taskId: string, userId: string, quantity: number) {
    // Validation before transaction (read-only checks)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || user.role?.code !== "WAREHOUSE") {
      throw new ForbiddenException("Только складист может принять товар");
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        product: {
          include: {
            productType: true,
            order: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Задача не найдена");
    }

    if (task.status !== TaskStatus.NEW && task.status !== TaskStatus.PASSED) {
      throw new BadRequestException(
        `Нельзя принять задачу в статусе "${task.status}"`,
      );
    }

    if (task.assignedToId !== userId && !isDepartmentAccount(user)) {
      throw new ForbiddenException("Вы не можете принять эту задачу");
    }

    if (task.stage !== ProductionStage.QUALITY_CHECK) {
      throw new BadRequestException(
        "Принять можно только на стадии проверки качества",
      );
    }

    // Batch-load workflow stages for all production stages (fix N+1)
    const workflowStages = await this.prisma.workflowStage.findMany({
      where: { isActive: true, legacyStage: { not: null } },
    });
    const workflowStageMap = new Map(
      workflowStages.map((ws) => [ws.legacyStage as string, ws]),
    );

    // All writes inside a single transaction
    const updatedTask = await this.prisma.$transaction(async (tx) => {
      // 1. Update task
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.PASSED,
          completedAt: new Date(),
          passedAt: new Date(),
          quantity,
        },
      });

      // 2. Update product
      await tx.product.update({
        where: { id: task.productId },
        data: {
          stage: ProductionStage.COMPLETED,
          quantity,
        },
      });

      // 3. Create quality check record
      await tx.qualityCheck.create({
        data: {
          productId: task.productId,
          checkedById: userId,
          status: "APPROVED",
          checkedAt: new Date(),
        },
      });

      // 4. Create work logs for ALL workers who worked on this product
      const nomenclatureId = task.product.nomenclatureId || null;

      const passedTasks = await tx.task.findMany({
        where: {
          productId: task.productId,
          status: TaskStatus.PASSED,
          stage: { not: ProductionStage.QUALITY_CHECK },
        },
        include: { assignedTo: true },
      });

      // Check which tasks already have work logs (batch query)
      const existingLogs = await tx.workLog.findMany({
        where: { taskId: { in: passedTasks.map((t) => t.id) } },
        select: { taskId: true },
      });
      const existingLogTaskIds = new Set(existingLogs.map((l) => l.taskId));

      for (const passedTask of passedTasks) {
        if (!existingLogTaskIds.has(passedTask.id)) {
          const ws = workflowStageMap.get(passedTask.stage);

          await this.payrollService.createWorkLog({
            userId: passedTask.assignedToId,
            productId: task.productId,
            taskId: passedTask.id,
            productTypeId: task.product.productTypeId,
            nomenclatureId: nomenclatureId || undefined,
            stage: passedTask.stage,
            workflowStageId: ws?.id,
            quantity: passedTask.quantity,
            completedAt: passedTask.passedAt || new Date(),
            notes: passedTask.notes || undefined,
          });
          this.logger.log(
            `WorkLog created for worker ${passedTask.assignedToId}, task ${passedTask.id}, stage ${passedTask.stage}`,
          );
        }
      }

      // 5. Add to inventory
      const existingInventory = await tx.inventoryItem.findFirst({
        where: { productId: task.productId },
      });

      if (existingInventory) {
        await tx.inventoryItem.update({
          where: { id: existingInventory.id },
          data: { quantity: existingInventory.quantity + quantity },
        });
      } else {
        await tx.inventoryItem.create({
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

      // 6. Update order status
      await this.updateOrderStatus(task.product.orderId, tx);

      return updated;
    });

    return updatedTask;
  }

  // Автоматическое обновление статуса заказа
  private async updateOrderStatus(orderId: string, tx?: any) {
    const db = tx || this.prisma;
    const products = await db.product.findMany({
      where: { orderId },
    });

    const allCompleted = products.every(
      (p) => p.stage === ProductionStage.COMPLETED,
    );

    const hasStarted = products.some(
      (p) => p.stage !== ProductionStage.PENDING,
    );

    let newStatus: string | null = null;

    if (allCompleted && products.length > 0) {
      newStatus = "COMPLETED";
    } else if (hasStarted) {
      newStatus = "IN_PRODUCTION";
    }

    if (newStatus) {
      await db.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
    }
  }

  // Получить все браки (с фото и без)
  async getDefectsWithPhotos(userId?: string) {
    // Получаем информацию о пользователе
    let user: { role?: { code: string } | null } | null = null;
    if (userId) {
      user = (await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      })) as any;
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
                status: "REJECTED",
              },
              include: {
                checkedBy: true,
              },
              orderBy: {
                checkedAt: "desc",
              },
              take: 1, // Берём только последний rejected check
            },
          },
        },
        assignedTo: true,
      },
      orderBy: {
        rejectedAt: "desc",
      },
    });

    // Преобразуем в нужный формат без дополнительных запросов
    const defects = rejectedTasks
      .filter((task) => task.product.qualityChecks.length > 0)
      .map((task) => {
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
    if (
      user &&
      (user.role?.code === "OWNER" ||
        user.role?.code === "SUPER_ADMIN" ||
        user.role?.code === "MANAGER")
    ) {
      return filteredDefects;
    }

    // Производственные рабочие видят только браки на своей стадии
    if (user) {
      const userStage =
        (user.role?.code ? ROLE_TO_STAGE[user.role.code] : null) ||
        ProductionStage.PENDING;
      filteredDefects = filteredDefects.filter(
        (d) => d.product?.stage === userStage,
      );
    }

    return filteredDefects;
  }

  // Принять брак на доработку (для любого работника)
  async acceptDefectRework(productId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new ForbiddenException("Пользователь не найден");
    }

    // Определяем стадию на основе роли пользователя
    const roleCode = user.role?.code;
    let userStage: ProductionStage;
    if (roleCode === "MANAGER") {
      userStage = ProductionStage.PENDING;
    } else if (roleCode && ROLE_TO_STAGE[roleCode]) {
      userStage = ROLE_TO_STAGE[roleCode];
    } else {
      throw new ForbiddenException(
        "Ваша роль не может принимать браки на доработку",
      );
    }
    const stageName = (STAGE_TO_NAME[userStage] || userStage).toUpperCase();

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
      throw new BadRequestException("Вы уже приняли этот брак на доработку");
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
        rejectedAt: "desc",
      },
    });

    if (!rejectedTask) {
      throw new NotFoundException("Забракованная задача не найдена");
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
        isDefect: true,
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

    this.logger.log(
      `User ${user.email} accepted defect rework for product ${productId}`,
    );
    return newTask;
  }

  // Получить количество непринятых браков (для любого работника)
  async getUnacceptedDefectsCount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return { count: 0 };
    }

    // Определяем стадию на основе роли пользователя
    const userRoleCode = user.role?.code;
    let userStage: ProductionStage | null = null;

    if (userRoleCode === "MANAGER") {
      userStage = ProductionStage.PENDING;
    } else if (
      userRoleCode &&
      ROLE_TO_STAGE[userRoleCode] &&
      userRoleCode !== "WAREHOUSE"
    ) {
      userStage = ROLE_TO_STAGE[userRoleCode];
    } else {
      // Для OWNER, WAREHOUSE и других - показываем все браки
      const allDefectsCount = await this.prisma.task.count({
        where: { status: TaskStatus.REJECTED },
      });
      return { count: allDefectsCount };
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
      distinct: ["productId"],
    });

    if (rejectedTasks.length === 0) {
      return { count: 0 };
    }

    const rejectedProductIds = rejectedTasks.map((t) => t.productId);

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
    const acceptedProductIds = new Set(userActiveTasks.map((t) => t.productId));
    const unacceptedCount = rejectedProductIds.filter(
      (id) => !acceptedProductIds.has(id),
    ).length;

    return { count: unacceptedCount };
  }

  async updateTaskQuantity(taskId: string, userId: string, quantity: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { assignedTo: true, product: true },
    });

    if (!task) {
      throw new NotFoundException("Задача не найдена");
    }

    if (quantity < 1) {
      throw new BadRequestException("Количество должно быть не менее 1");
    }

    if (quantity > (task.product?.quantity || 0)) {
      throw new BadRequestException(
        "Количество не может превышать количество в продукте",
      );
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { quantity },
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
    });

    this.logger.log(
      `Task ${taskId} quantity updated to ${quantity} by user ${userId}`,
    );
    return updated;
  }
}
