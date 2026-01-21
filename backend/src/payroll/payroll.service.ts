import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollStatus, ProductionStage } from '@prisma/client';
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
} from './dto';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // ==================== РАСЦЕНКИ (WorkRate) ====================

  async findAllWorkRates() {
    return this.prisma.workRate.findMany({
      include: {
        productType: true,
        workflowStage: true,
      },
      orderBy: [
        { productType: { name: 'asc' } },
        { stage: 'asc' },
      ],
    });
  }

  async findActiveWorkRates() {
    return this.prisma.workRate.findMany({
      where: { isActive: true },
      include: {
        productType: true,
        workflowStage: true,
      },
      orderBy: [
        { productType: { name: 'asc' } },
        { stage: 'asc' },
      ],
    });
  }

  async findWorkRate(productTypeId: string, stage: ProductionStage) {
    return this.prisma.workRate.findUnique({
      where: {
        productTypeId_stage: { productTypeId, stage },
      },
      include: {
        productType: true,
        workflowStage: true,
      },
    });
  }

  async createWorkRate(dto: CreateWorkRateDto) {
    const existing = await this.prisma.workRate.findUnique({
      where: {
        productTypeId_stage: { productTypeId: dto.productTypeId, stage: dto.stage },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Расценка для типа продукта и этапа "${dto.stage}" уже существует`,
      );
    }

    return this.prisma.workRate.create({
      data: dto,
      include: {
        productType: true,
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
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
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
      orderBy: { date: 'desc' },
    });
  }

  async createPenalty(dto: CreatePenaltyDto, createdById: string) {
    return this.prisma.penalty.create({
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
      throw new BadRequestException('Штраф уже отменен');
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
      orderBy: { createdAt: 'asc' },
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
    if (dto.userId) {
      const existing = await this.prisma.managerCommission.findUnique({
        where: { userId: dto.userId },
      });
      if (existing) {
        throw new ConflictException('Настройки комиссии для этого пользователя уже существуют');
      }
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
      orderBy: [
        { periodStart: 'desc' },
        { user: { lastName: 'asc' } },
      ],
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
  async calculatePayrollForUser(userId: string, periodStart: Date, periodEnd: Date) {
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
      throw new ConflictException('Расчет за этот период уже существует');
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
        ordersAmount = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      }

      commissionAmount = ordersAmount * (commission.commissionPercent / 100);
    }

    // Итого к выплате
    const totalAmount = baseSalary + workAmount + commissionAmount - penaltyAmount;

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
        const period = await this.calculatePayrollForUser(user.id, periodStart, periodEnd);
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
      throw new BadRequestException('Можно утвердить только черновик');
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
      throw new BadRequestException('Можно выплатить только утвержденный расчет');
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
      throw new BadRequestException('Нельзя отменить уже выплаченный расчет');
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

    if (period.status !== PayrollStatus.DRAFT && period.status !== PayrollStatus.CANCELLED) {
      throw new BadRequestException('Можно удалить только черновик или отмененный расчет');
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
    stage: ProductionStage;
    workflowStageId?: string;
    quantity: number;
    completedAt: Date;
    notes?: string;
  }) {
    // Получаем расценку
    const workRate = await this.findWorkRate(data.productTypeId, data.stage);
    const pricePerUnit = workRate?.pricePerUnit || 0;
    const totalAmount = data.quantity * pricePerUnit;

    return this.prisma.workLog.create({
      data: {
        ...data,
        pricePerUnit,
        totalAmount,
      },
    });
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
        where.completedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.completedAt.lte = new Date(filters.endDate);
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
      orderBy: { completedAt: 'desc' },
    });
  }

  // Сводка по зарплате за период
  async getPayrollSummary(periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Получаем все работы за период сгруппированные по пользователям
    const workLogsByUser = await this.prisma.workLog.groupBy({
      by: ['userId'],
      where: {
        completedAt: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Получаем все штрафы за период сгруппированные по пользователям
    const penaltiesByUser = await this.prisma.penalty.groupBy({
      by: ['userId'],
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

    // Формируем сводку по каждому пользователю
    const usersPromises = usersData.map(async (user) => {
      const workData = workLogsByUser.find((w) => w.userId === user.id);
      const penaltyData = penaltiesByUser.find((p) => p.userId === user.id);

      const workAmount = workData?._sum.totalAmount || 0;
      const penaltyAmount = penaltyData?._sum.amount || 0;

      // Расчёт комиссии для менеджеров
      let commissionAmount = 0;
      const userCommission = commissions.find(c => c.userId === user.id)
        || commissions.find(c => c.roleId === user.roleId);

      if (userCommission) {
        const ordersData = await this.prisma.order.aggregate({
          where: {
            createdById: user.id,
            createdAt: { gte: start, lte: end },
            totalAmount: userCommission.minOrderAmount
              ? { gte: userCommission.minOrderAmount }
              : { not: null },
          },
          _sum: { totalAmount: true },
        });
        const ordersAmount = ordersData._sum.totalAmount || 0;
        commissionAmount = ordersAmount * (userCommission.commissionPercent / 100);
      }

      const totalAmount = workAmount + commissionAmount - penaltyAmount;

      return {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role?.name || 'Без роли',
        workAmount,
        commissionAmount,
        penaltyAmount,
        totalAmount,
        workLogsCount: workData?._count || 0,
      };
    });

    const users = await Promise.all(usersPromises);

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
}
