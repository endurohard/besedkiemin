import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramService } from "../telegram/telegram.service";
import { PayrollStatus, ProductionStage } from "@prisma/client";
import {
  CreateWorkRateDto,
  UpdateWorkRateDto,
  CreatePenaltyDto,
  UpdatePenaltyDto,
  CreatePayrollPeriodDto,
  UpdatePayrollPeriodDto,
  CalculatePayrollDto,
  CreateManagerCommissionDto,
  UpdateManagerCommissionDto,
} from "./dto";

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  // ==================== РАСЦЕНКИ (WorkRate) ====================

  async findAllWorkRates() {
    return this.prisma.workRate.findMany({
      include: {
        productType: true,
        nomenclature: true,
        workflowStage: true,
      },
      orderBy: [{ productType: { name: "asc" } }, { stage: "asc" }],
    });
  }

  async findActiveWorkRates() {
    return this.prisma.workRate.findMany({
      where: { isActive: true },
      include: {
        productType: true,
        nomenclature: true,
        workflowStage: true,
      },
      orderBy: [{ productType: { name: "asc" } }, { stage: "asc" }],
    });
  }

  async findWorkRate(
    productTypeId: string,
    stage: ProductionStage,
    nomenclatureId?: string,
  ) {
    // Сначала ищем по номенклатуре (если указана)
    if (nomenclatureId) {
      const byNomenclature = await this.prisma.workRate.findUnique({
        where: {
          nomenclatureId_stage: { nomenclatureId, stage },
        },
        include: {
          productType: true,
          nomenclature: true,
          workflowStage: true,
        },
      });
      if (byNomenclature) return byNomenclature;
    }

    // Ищем по типу продукта (без привязки к номенклатуре)
    const byType = await this.prisma.workRate.findFirst({
      where: {
        productTypeId,
        stage,
        nomenclatureId: null,
      },
      include: {
        productType: true,
        workflowStage: true,
      },
    });
    if (byType) return byType;

    // Fallback: если расценок без номенклатуры нет — берём среднюю по всем расценкам
    // для данного типа продукта и этапа (продукт не привязан к конкретной номенклатуре)
    const allRates = await this.prisma.workRate.findMany({
      where: { productTypeId, stage, isActive: true },
      include: { productType: true, workflowStage: true },
    });
    if (allRates.length === 0) return null;
    if (allRates.length === 1) return allRates[0];
    const avgPrice = Math.round(
      allRates.reduce((sum, r) => sum + r.pricePerUnit, 0) / allRates.length,
    );
    return { ...allRates[0], pricePerUnit: avgPrice };
  }

  async createWorkRate(dto: CreateWorkRateDto) {
    // Проверяем существование расценки
    const existing = await this.prisma.workRate.findFirst({
      where: {
        productTypeId: dto.productTypeId,
        stage: dto.stage,
        nomenclatureId: dto.nomenclatureId || null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Расценка для этого изделия и этапа "${dto.stage}" уже существует`,
      );
    }

    return this.prisma.workRate.create({
      data: dto,
      include: {
        productType: true,
        nomenclature: true,
        workflowStage: true,
      },
    });
  }

  async updateWorkRate(id: string, dto: UpdateWorkRateDto) {
    return this.prisma.workRate.update({
      where: { id },
      data: dto,
      include: {
        productType: true,
        workflowStage: true,
      },
    });
  }

  async deleteWorkRate(id: string) {
    await this.prisma.workRate.delete({ where: { id } });
    return { success: true };
  }

  // ==================== ШТРАФЫ (Penalty) ====================

  async findAllPenalties(filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    includeCancelled?: boolean;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (!filters?.includeCancelled) {
      where.isCancelled = false;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        const d = new Date(filters.startDate);
        if (!isNaN(d.getTime())) where.date.gte = d;
      }
      if (filters.endDate) {
        const d = new Date(filters.endDate);
        if (!isNaN(d.getTime())) where.date.lte = d;
      }
    }

    return this.prisma.penalty.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            productType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  async createPenalty(dto: CreatePenaltyDto, createdById: string) {
    const penalty = await this.prisma.penalty.create({
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : new Date(),
        createdById,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        product: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Отправляем уведомление в Telegram
    try {
      const createdByName = penalty.createdBy
        ? `${penalty.createdBy.lastName} ${penalty.createdBy.firstName}`
        : "Система";
      await this.telegramService.sendPenaltyNotification({
        userId: dto.userId,
        amount: dto.amount,
        reason: dto.reason,
        createdByName,
      });
    } catch (error) {
      this.logger.error("Failed to send penalty Telegram notification", error);
    }

    return penalty;
  }

  async updatePenalty(id: string, dto: UpdatePenaltyDto) {
    return this.prisma.penalty.update({
      where: { id },
      data: dto,
      include: {
        user: true,
        product: true,
        createdBy: true,
      },
    });
  }

  async cancelPenalty(id: string, cancelledById: string, notes?: string) {
    const penalty = await this.prisma.penalty.findUnique({ where: { id } });
    if (!penalty) {
      throw new NotFoundException(`Штраф с ID ${id} не найден`);
    }

    if (penalty.isCancelled) {
      throw new BadRequestException("Штраф уже отменен");
    }

    // Нельзя отменять штрафы, включённые в выплаченный расчёт
    if (penalty.payrollPeriodId) {
      const period = await this.prisma.payrollPeriod.findUnique({
        where: { id: penalty.payrollPeriodId },
      });
      if (period?.status === PayrollStatus.PAID) {
        throw new BadRequestException(
          "Нельзя отменить штраф, включённый в выплаченный расчёт",
        );
      }
    }

    return this.prisma.penalty.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledById,
        notes: notes || penalty.notes,
      },
    });
  }

  // ==================== НАСТРОЙКИ КОМИССИИ МЕНЕДЖЕРА ====================

  async findAllManagerCommissions() {
    return this.prisma.managerCommission.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        role: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findManagerCommission(userId: string) {
    // Сначала ищем настройки для конкретного пользователя
    let commission = await this.prisma.managerCommission.findUnique({
      where: { userId },
      include: { user: true, role: true },
    });

    // Если нет - ищем для роли пользователя
    if (!commission) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true },
      });

      if (user) {
        commission = await this.prisma.managerCommission.findFirst({
          where: { roleId: user.roleId, isActive: true },
          include: { user: true, role: true },
        });
      }
    }

    return commission;
  }

  async createManagerCommission(dto: CreateManagerCommissionDto) {
    // Проверяем существование пользователя
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user) {
        throw new NotFoundException("Пользователь не найден");
      }

      const existing = await this.prisma.managerCommission.findUnique({
        where: { userId: dto.userId },
      });
      if (existing) {
        throw new ConflictException(
          "Настройки комиссии для этого пользователя уже существуют",
        );
      }
    }

    // Проверяем существование роли
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role) {
        throw new NotFoundException("Роль не найдена");
      }
    }

    // Должен быть указан хотя бы userId или roleId
    if (!dto.userId && !dto.roleId) {
      throw new BadRequestException("Необходимо указать userId или roleId");
    }

    return this.prisma.managerCommission.create({
      data: dto,
      include: { user: true, role: true },
    });
  }

  async updateManagerCommission(id: string, dto: UpdateManagerCommissionDto) {
    return this.prisma.managerCommission.update({
      where: { id },
      data: dto,
      include: { user: true, role: true },
    });
  }

  async deleteManagerCommission(id: string) {
    await this.prisma.managerCommission.delete({ where: { id } });
    return { success: true };
  }

  // ==================== РАСЧЕТ ЗАРПЛАТЫ (PayrollPeriod) ====================

  async findAllPayrollPeriods(filters?: {
    userId?: string;
    status?: PayrollStatus;
    periodStart?: string;
    periodEnd?: string;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.periodStart) {
      const startDate = new Date(filters.periodStart);
      if (!isNaN(startDate.getTime())) {
        where.periodStart = { gte: startDate };
      }
    }

    if (filters?.periodEnd) {
      const endDate = new Date(filters.periodEnd);
      if (!isNaN(endDate.getTime())) {
        where.periodEnd = { lte: endDate };
      }
    }

    return this.prisma.payrollPeriod.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        workLogs: {
          include: {
            product: true,
            productType: true,
          },
        },
        penalties: true,
      },
      orderBy: [{ periodStart: "desc" }, { user: { lastName: "asc" } }],
    });
  }

  async findPayrollPeriod(id: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        workLogs: {
          include: {
            product: {
              include: {
                order: true,
              },
            },
            productType: true,
            task: true,
          },
        },
        penalties: {
          include: {
            product: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException(`Расчетный период с ID ${id} не найден`);
    }

    return period;
  }

  // Расчет зарплаты для одного пользователя за период
  async calculatePayrollForUser(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    // Проверяем, не существует ли уже расчет за этот период
    const existingPeriod = await this.prisma.payrollPeriod.findUnique({
      where: {
        userId_periodStart_periodEnd: {
          userId,
          periodStart,
          periodEnd,
        },
      },
    });

    if (existingPeriod) {
      throw new ConflictException("Расчет за этот период уже существует");
    }

    // Получаем записи о выполненной работе за период
    const workLogs = await this.prisma.workLog.findMany({
      where: {
        userId,
        completedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        payrollPeriodId: null, // Только непривязанные записи
      },
    });

    // Сумма за работу
    const workAmount = workLogs.reduce((sum, log) => sum + log.totalAmount, 0);

    // Получаем штрафы за период
    const penalties = await this.prisma.penalty.findMany({
      where: {
        userId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
        isCancelled: false,
        payrollPeriodId: null,
      },
    });

    const penaltyAmount = penalties.reduce((sum, p) => sum + p.amount, 0);

    // Для менеджеров - расчет комиссии
    let baseSalary = 0;
    let commissionAmount = 0;
    let ordersAmount = 0;

    const commission = await this.findManagerCommission(userId);
    if (commission) {
      baseSalary = commission.baseSalary;

      // Получаем сумму заказов менеджера за период
      const ordersData = await this.prisma.order.aggregate({
        where: {
          createdById: userId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
          totalAmount: { not: null },
        },
        _sum: {
          totalAmount: true,
        },
      });

      ordersAmount = ordersData._sum.totalAmount || 0;

      // Фильтруем заказы по минимальной сумме (если задана)
      if (commission.minOrderAmount) {
        const filteredOrders = await this.prisma.order.findMany({
          where: {
            createdById: userId,
            createdAt: {
              gte: periodStart,
              lte: periodEnd,
            },
            totalAmount: { gte: commission.minOrderAmount },
          },
          select: { totalAmount: true },
        });
        ordersAmount = filteredOrders.reduce(
          (sum, o) => sum + (o.totalAmount || 0),
          0,
        );
      }

      commissionAmount = ordersAmount * (commission.commissionPercent / 100);
    }

    // Итого к выплате
    const totalAmount =
      baseSalary + workAmount + commissionAmount - penaltyAmount;

    // Создаем расчетный период
    const payrollPeriod = await this.prisma.$transaction(async (tx) => {
      const period = await tx.payrollPeriod.create({
        data: {
          userId,
          periodStart,
          periodEnd,
          baseSalary,
          workAmount,
          commissionAmount,
          ordersAmount,
          penaltyAmount,
          totalAmount: Math.max(0, totalAmount),
          status: PayrollStatus.DRAFT,
        },
      });

      // Привязываем workLogs к периоду
      if (workLogs.length > 0) {
        await tx.workLog.updateMany({
          where: {
            id: { in: workLogs.map((w) => w.id) },
          },
          data: { payrollPeriodId: period.id },
        });
      }

      // Привязываем штрафы к периоду
      if (penalties.length > 0) {
        await tx.penalty.updateMany({
          where: {
            id: { in: penalties.map((p) => p.id) },
          },
          data: { payrollPeriodId: period.id },
        });
      }

      return period;
    });

    return this.findPayrollPeriod(payrollPeriod.id);
  }

  // Массовый расчет зарплаты для всех активных пользователей
  async calculatePayrollForAll(dto: CalculatePayrollDto) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    let users: { id: string }[];

    if (dto.userId) {
      users = [{ id: dto.userId }];
    } else {
      users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
    }

    const results: any[] = [];

    for (const user of users) {
      try {
        const period = await this.calculatePayrollForUser(
          user.id,
          periodStart,
          periodEnd,
        );
        results.push({ userId: user.id, success: true, period });
      } catch (error) {
        results.push({
          userId: user.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Утверждение расчетного периода
  async approvePayrollPeriod(id: string, approvedById: string, notes?: string) {
    const period = await this.findPayrollPeriod(id);

    if (period.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException("Можно утвердить только черновик");
    }

    return this.prisma.payrollPeriod.update({
      where: { id },
      data: {
        status: PayrollStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
        notes: notes || period.notes,
      },
      include: { user: true },
    });
  }

  // Отметка о выплате
  async markPayrollAsPaid(id: string, paidById: string, notes?: string) {
    const period = await this.findPayrollPeriod(id);

    if (period.status !== PayrollStatus.APPROVED) {
      throw new BadRequestException(
        "Можно выплатить только утвержденный расчет",
      );
    }

    return this.prisma.payrollPeriod.update({
      where: { id },
      data: {
        status: PayrollStatus.PAID,
        paidById,
        paidAt: new Date(),
        notes: notes || period.notes,
      },
      include: { user: true },
    });
  }

  // Отмена расчетного периода
  async cancelPayrollPeriod(id: string) {
    const period = await this.findPayrollPeriod(id);

    if (period.status === PayrollStatus.PAID) {
      throw new BadRequestException("Нельзя отменить уже выплаченный расчет");
    }

    // Отвязываем workLogs и penalties
    await this.prisma.$transaction([
      this.prisma.workLog.updateMany({
        where: { payrollPeriodId: id },
        data: { payrollPeriodId: null },
      }),
      this.prisma.penalty.updateMany({
        where: { payrollPeriodId: id },
        data: { payrollPeriodId: null },
      }),
      this.prisma.payrollPeriod.update({
        where: { id },
        data: { status: PayrollStatus.CANCELLED },
      }),
    ]);

    return { success: true };
  }

  // Удаление расчетного периода (только черновики)
  async deletePayrollPeriod(id: string) {
    const period = await this.findPayrollPeriod(id);

    if (
      period.status !== PayrollStatus.DRAFT &&
      period.status !== PayrollStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Можно удалить только черновик или отмененный расчет",
      );
    }

    // Отвязываем workLogs и penalties
    await this.prisma.$transaction([
      this.prisma.workLog.updateMany({
        where: { payrollPeriodId: id },
        data: { payrollPeriodId: null },
      }),
      this.prisma.penalty.updateMany({
        where: { payrollPeriodId: id },
        data: { payrollPeriodId: null },
      }),
      this.prisma.payrollPeriod.delete({
        where: { id },
      }),
    ]);

    return { success: true };
  }

  // ==================== ЖУРНАЛ РАБОТ (WorkLog) ====================

  // Создание записи в журнале работ (вызывается из TasksService)
  async createWorkLog(data: {
    userId: string;
    productId: string;
    taskId?: string;
    productTypeId: string;
    nomenclatureId?: string;
    stage: ProductionStage;
    workflowStageId?: string;
    quantity: number;
    completedAt: Date;
    notes?: string;
  }) {
    // Проверяем что номенклатура соответствует типу продукта
    if (data.nomenclatureId) {
      const nomenclature = await this.prisma.nomenclature.findUnique({
        where: { id: data.nomenclatureId },
        select: { productTypeId: true },
      });
      if (nomenclature && nomenclature.productTypeId !== data.productTypeId) {
        this.logger.warn(
          `Nomenclature ${data.nomenclatureId} belongs to productType ${nomenclature.productTypeId}, ` +
            `but workLog has productType ${data.productTypeId}. Ignoring nomenclatureId.`,
        );
        data.nomenclatureId = undefined;
      }
    }

    // Проверяем тип оплаты сотрудника
    const worker = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { paymentType: true },
    });
    const isSalaryWorker = worker?.paymentType === "SALARY";

    // Для окладников расценка = 0 (только учёт выработки, зарплата фиксированная)
    let pricePerUnit = 0;
    let totalAmount = 0;
    if (!isSalaryWorker) {
      // Получаем расценку - сначала по номенклатуре, потом по типу
      const workRate = await this.findWorkRate(
        data.productTypeId,
        data.stage,
        data.nomenclatureId,
      );
      pricePerUnit = workRate?.pricePerUnit || 0;
      totalAmount = data.quantity * pricePerUnit;
    }

    return this.prisma.workLog.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        taskId: data.taskId,
        productTypeId: data.productTypeId,
        stage: data.stage,
        workflowStageId: data.workflowStageId,
        quantity: data.quantity,
        completedAt: data.completedAt,
        notes: data.notes,
        pricePerUnit,
        totalAmount,
      },
    });
  }

  // Пересчёт work_logs с нулевой ценой (разовая операция исправления данных)
  async recalculateZeroWorkLogs(): Promise<{ fixed: number; skipped: number }> {
    const zeroLogs = await this.prisma.workLog.findMany({
      where: { pricePerUnit: 0 },
      include: {
        user: { select: { paymentType: true } },
      },
    });

    let fixed = 0;
    let skipped = 0;

    for (const log of zeroLogs) {
      // Окладники — price=0 корректно
      if (log.user?.paymentType === 'SALARY') {
        skipped++;
        continue;
      }

      const rate = await this.findWorkRate(
        log.productTypeId,
        log.stage,
        undefined,
      );

      if (!rate || rate.pricePerUnit === 0) {
        skipped++;
        continue;
      }

      await this.prisma.workLog.update({
        where: { id: log.id },
        data: {
          pricePerUnit: rate.pricePerUnit,
          totalAmount: log.quantity * rate.pricePerUnit,
        },
      });
      fixed++;
    }

    return { fixed, skipped };
  }

  // Получение журнала работ
  async findWorkLogs(filters?: {
    userId?: string;
    productTypeId?: string;
    stage?: ProductionStage;
    startDate?: string;
    endDate?: string;
    unassigned?: boolean; // Только непривязанные к расчетному периоду
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.productTypeId) {
      where.productTypeId = filters.productTypeId;
    }

    if (filters?.stage) {
      where.stage = filters.stage;
    }

    if (filters?.startDate || filters?.endDate) {
      where.completedAt = {};
      if (filters.startDate) {
        const d = new Date(filters.startDate);
        if (!isNaN(d.getTime())) where.completedAt.gte = d;
      }
      if (filters.endDate) {
        const d = new Date(filters.endDate);
        if (!isNaN(d.getTime())) where.completedAt.lte = d;
      }
    }

    if (filters?.unassigned) {
      where.payrollPeriodId = null;
    }

    return this.prisma.workLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        product: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerName: true,
              },
            },
          },
        },
        productType: true,
        task: true,
      },
      orderBy: { completedAt: "desc" },
    });
  }

  // Заработок работника (для PIN-входа и просмотра своих данных)
  async getWorkerEarnings(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    // Определяем период (по умолчанию — текущий месяц)
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Заработок за сегодня
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [workLogs, todayLogs, penalties, todayPenalties, paidPeriods, allTimeEarnings, allTimePenalties] = await Promise.all([
      // Все работы за период
      this.prisma.workLog.findMany({
        where: {
          userId,
          completedAt: { gte: start, lte: end },
        },
        include: {
          product: {
            select: { id: true, name: true },
          },
          productType: {
            select: { id: true, name: true },
          },
        },
        orderBy: { completedAt: "desc" },
      }),
      // Работы за сегодня
      this.prisma.workLog.findMany({
        where: {
          userId,
          completedAt: { gte: todayStart, lte: todayEnd },
        },
        include: {
          product: { select: { id: true, name: true } },
          productType: { select: { id: true, name: true } },
        },
        orderBy: { completedAt: "desc" },
      }),
      // Штрафы за период
      this.prisma.penalty.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
          isCancelled: false,
        },
        orderBy: { date: "desc" },
      }),
      // Штрафы за сегодня
      this.prisma.penalty.findMany({
        where: {
          userId,
          date: { gte: todayStart, lte: todayEnd },
          isCancelled: false,
        },
      }),
      // Все выдачи (PAID периоды) — для баланса
      this.prisma.payrollPeriod.findMany({
        where: { userId, status: PayrollStatus.PAID },
        orderBy: { paidAt: "desc" },
      }),
      // Весь заработок за всё время (для баланса)
      this.prisma.workLog.aggregate({
        where: { userId },
        _sum: { totalAmount: true },
      }),
      // Все штрафы за всё время (для баланса)
      this.prisma.penalty.aggregate({
        where: { userId, isCancelled: false },
        _sum: { amount: true },
      }),
    ]);

    const periodTotal = workLogs.reduce((sum, log) => sum + log.totalAmount, 0);
    const todayTotal = todayLogs.reduce((sum, log) => sum + log.totalAmount, 0);
    const penaltyTotal = penalties.reduce((sum, p) => sum + p.amount, 0);
    const todayPenaltyTotal = todayPenalties.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    // Накопленный баланс (всё время)
    const totalEarnedAllTime = allTimeEarnings._sum.totalAmount || 0;
    const totalPenaltiesAllTime = allTimePenalties._sum.amount || 0;
    const totalPaid = paidPeriods.reduce((sum, p) => sum + p.totalAmount, 0);
    const accumulatedBalance = totalEarnedAllTime - totalPenaltiesAllTime - totalPaid;

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      today: {
        earnings: todayTotal,
        penalties: todayPenaltyTotal,
        net: todayTotal - todayPenaltyTotal,
        workLogs: todayLogs.map((log) => ({
          id: log.id,
          product: log.product?.name,
          productType: log.productType?.name,
          stage: log.stage,
          quantity: log.quantity,
          pricePerUnit: log.pricePerUnit,
          totalAmount: log.totalAmount,
          completedAt: log.completedAt,
        })),
      },
      period_totals: {
        earnings: periodTotal,
        penalties: penaltyTotal,
        net: periodTotal - penaltyTotal,
        workLogsCount: workLogs.length,
      },
      recentWorkLogs: workLogs.slice(0, 20).map((log) => ({
        id: log.id,
        product: log.product?.name,
        productType: log.productType?.name,
        stage: log.stage,
        quantity: log.quantity,
        pricePerUnit: log.pricePerUnit,
        totalAmount: log.totalAmount,
        completedAt: log.completedAt,
      })),
      penalties: penalties.map((p) => ({
        id: p.id,
        amount: p.amount,
        reason: p.reason,
        date: p.date,
      })),
      // Выдачи (PAID периоды) — история списаний
      paidPeriods: paidPeriods.map((p) => ({
        id: p.id,
        amount: p.totalAmount,
        paidAt: p.paidAt,
        paidBy: null,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        notes: p.notes,
      })),
      // Накопленный баланс (за всё время)
      balance: {
        totalEarned: totalEarnedAllTime,
        totalPenalties: totalPenaltiesAllTime,
        totalPaid,
        accumulated: accumulatedBalance,
      },
    };
  }

  // Сводка по зарплате за период
  async getPayrollSummary(periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException("Неверный формат даты периода");
    }

    // Получаем все работы за период сгруппированные по пользователям
    const workLogsByUser = await this.prisma.workLog.groupBy({
      by: ["userId"],
      where: {
        completedAt: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Получаем все штрафы за период сгруппированные по пользователям
    const penaltiesByUser = await this.prisma.penalty.groupBy({
      by: ["userId"],
      where: {
        date: { gte: start, lte: end },
        isCancelled: false,
      },
      _sum: { amount: true },
    });

    // Получаем всех пользователей с их ролями
    const userIds = [
      ...new Set([
        ...workLogsByUser.map((w) => w.userId),
        ...penaltiesByUser.map((p) => p.userId),
      ]),
    ];

    const usersData = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { role: true },
    });

    // Получаем настройки комиссий для расчёта
    const commissions = await this.prisma.managerCommission.findMany({
      where: { isActive: true },
    });

    // Batch-load order totals for users with commissions (fix N+1)
    const usersWithCommissions = usersData.filter((u) => {
      return commissions.some(
        (c) => c.userId === u.id || c.roleId === u.roleId,
      );
    });
    const commissionUserIds = usersWithCommissions.map((u) => u.id);

    // Single groupBy query instead of N individual aggregates
    const ordersByUser = new Map<string, number>();
    const ordersWithMinByUser = new Map<string, number>();

    if (commissionUserIds.length > 0) {
      const orderGroups = await this.prisma.order.groupBy({
        by: ["createdById"],
        _sum: { totalAmount: true },
        where: {
          createdById: { in: commissionUserIds },
          createdAt: { gte: start, lte: end },
          totalAmount: { not: null },
        },
      });

      for (const group of orderGroups) {
        ordersByUser.set(group.createdById, group._sum.totalAmount || 0);
      }

      // For commissions with minOrderAmount, we need filtered totals
      // Collect unique minOrderAmounts
      const minAmounts = [
        ...new Set(
          commissions
            .filter((c) => c.minOrderAmount)
            .map((c) => c.minOrderAmount),
        ),
      ];

      if (minAmounts.length > 0) {
        // For each distinct minOrderAmount, run one query for all relevant users
        for (const minAmount of minAmounts) {
          const relevantUserIds = commissionUserIds.filter((uid) => {
            const uc =
              commissions.find((c) => c.userId === uid) ||
              commissions.find(
                (c) => c.roleId === usersData.find((u) => u.id === uid)?.roleId,
              );
            return uc?.minOrderAmount === minAmount;
          });

          if (relevantUserIds.length > 0) {
            const filteredGroups = await this.prisma.order.groupBy({
              by: ["createdById"],
              _sum: { totalAmount: true },
              where: {
                createdById: { in: relevantUserIds },
                createdAt: { gte: start, lte: end },
                totalAmount: { gte: minAmount! },
              },
            });
            for (const group of filteredGroups) {
              ordersWithMinByUser.set(
                group.createdById,
                group._sum.totalAmount || 0,
              );
            }
          }
        }
      }
    }

    // Формируем сводку по каждому пользователю (synchronous now - no DB calls)
    const users = usersData.map((user) => {
      const workData = workLogsByUser.find((w) => w.userId === user.id);
      const penaltyData = penaltiesByUser.find((p) => p.userId === user.id);

      const workAmount = workData?._sum.totalAmount || 0;
      const penaltyAmount = penaltyData?._sum.amount || 0;

      // Расчёт комиссии для менеджеров
      let commissionAmount = 0;
      let baseSalary = 0;
      const userCommission =
        commissions.find((c) => c.userId === user.id) ||
        commissions.find((c) => c.roleId === user.roleId);

      if (userCommission) {
        baseSalary = userCommission.baseSalary || 0;
        const ordersAmount = userCommission.minOrderAmount
          ? ordersWithMinByUser.get(user.id) || 0
          : ordersByUser.get(user.id) || 0;
        commissionAmount =
          ordersAmount * (userCommission.commissionPercent / 100);
      }

      const totalAmount =
        baseSalary + workAmount + commissionAmount - penaltyAmount;

      return {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role?.name || "Без роли",
        baseSalary,
        workAmount,
        commissionAmount,
        penaltyAmount,
        totalAmount,
        workLogsCount: workData?._count || 0,
      };
    });

    // Итоги
    const totals = {
      workAmount: users.reduce((sum, u) => sum + u.workAmount, 0),
      commissionAmount: users.reduce((sum, u) => sum + u.commissionAmount, 0),
      penaltyAmount: users.reduce((sum, u) => sum + u.penaltyAmount, 0),
      totalAmount: users.reduce((sum, u) => sum + u.totalAmount, 0),
    };

    return {
      period: { start: periodStart, end: periodEnd },
      totals,
      users,
    };
  }

  // Статистика производственных работников за период
  async getWorkerStats(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Производственные роли
    const productionRoleCodes = ["PREPARER", "PAINTER", "ASSEMBLER", "SEWER"];

    const workers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { code: { in: productionRoleCodes } },
      },
      include: {
        role: true,
      },
    });

    const workerIds = workers.map((w) => w.id);

    const [workLogsGrouped, penaltiesGrouped] = await Promise.all([
      this.prisma.workLog.groupBy({
        by: ["userId"],
        where: {
          userId: { in: workerIds },
          completedAt: { gte: start, lte: end },
        },
        _sum: { quantity: true, totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.penalty.groupBy({
        by: ["userId"],
        where: {
          userId: { in: workerIds },
          date: { gte: start, lte: end },
          isCancelled: false,
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const workByUser = new Map(workLogsGrouped.map((w) => [w.userId, w]));
    const penaltyByUser = new Map(penaltiesGrouped.map((p) => [p.userId, p]));

    return workers.map((worker) => {
      const work = workByUser.get(worker.id);
      const penalty = penaltyByUser.get(worker.id);

      const itemsCompleted = work?._sum.quantity ?? 0;
      const workAmount = work?._sum.totalAmount ?? 0;
      const workLogsCount = work?._count._all ?? 0;
      const penaltyAmount = penalty?._sum.amount ?? 0;
      const penaltyCount = penalty?._count._all ?? 0;
      const netAmount = workAmount - penaltyAmount;

      let efficiencyCoefficient: number | null = null;
      if (
        worker.paymentType === "SALARY" &&
        worker.monthlySalary &&
        worker.monthlySalary > 0
      ) {
        efficiencyCoefficient =
          Math.round((workAmount / worker.monthlySalary) * 100) / 100;
      }

      return {
        userId: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        roleCode: worker.role?.code,
        paymentType: worker.paymentType,
        monthlySalary: worker.monthlySalary,
        itemsCompleted,
        workAmount,
        penaltyAmount,
        penaltyCount,
        netAmount,
        efficiencyCoefficient,
        workLogsCount,
      };
    });
  }
}
