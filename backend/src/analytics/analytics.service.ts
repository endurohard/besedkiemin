import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ProductionStage,
  OrderStatus,
  QualityStatus,
  ShipmentStatus,
} from "@prisma/client";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Общая статистика производства
  async getProductionOverview() {
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      totalProducts,
      productsInProduction,
      completedProducts,
      rejectedProducts,
      pendingQualityChecks,
    ] = await Promise.all([
      // Общее количество заказов
      this.prisma.order.count(),

      // Активные заказы (новые + в производстве)
      this.prisma.order.count({
        where: {
          status: {
            in: [OrderStatus.NEW, OrderStatus.IN_PRODUCTION],
          },
        },
      }),

      // Завершенные заказы
      this.prisma.order.count({
        where: { status: OrderStatus.COMPLETED },
      }),

      // Общее количество продуктов
      this.prisma.product.count(),

      // Продукты в производстве
      this.prisma.product.count({
        where: {
          stage: {
            notIn: [
              ProductionStage.PENDING,
              ProductionStage.COMPLETED,
              ProductionStage.REJECTED,
            ],
          },
        },
      }),

      // Завершенные продукты
      this.prisma.product.count({
        where: { stage: ProductionStage.COMPLETED },
      }),

      // Забракованные продукты - считаем по уникальным продуктам, которые были забракованы
      this.prisma.qualityCheck
        .groupBy({
          by: ["productId"],
          where: { status: QualityStatus.REJECTED },
        })
        .then((result) => result.length),

      // Продукты ожидающие проверки качества
      this.prisma.product.count({
        where: { stage: ProductionStage.QUALITY_CHECK },
      }),
    ]);

    // Статистика по этапам
    const productsByStage = await this.prisma.product.groupBy({
      by: ["stage"],
      _count: true,
    });

    const stageStats = productsByStage.reduce(
      (acc, item) => {
        acc[item.stage] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      orders: {
        total: totalOrders,
        active: activeOrders,
        completed: completedOrders,
        completionRate:
          totalOrders > 0
            ? ((completedOrders / totalOrders) * 100).toFixed(1)
            : "0",
      },
      products: {
        total: totalProducts,
        inProduction: productsInProduction,
        completed: completedProducts,
        rejected: rejectedProducts,
        pendingQualityCheck: pendingQualityChecks,
        completionRate:
          totalProducts > 0
            ? ((completedProducts / totalProducts) * 100).toFixed(1)
            : "0",
      },
      stageDistribution: stageStats,
    };
  }

  // Производительность по сотрудникам (оптимизированный)
  async getUserPerformance() {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { code: { not: "SUPER_ADMIN" } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: { select: { code: true, name: true } },
        productHistory: {
          select: {
            startedAt: true,
            completedAt: true,
            stage: true,
            product: {
              select: {
                name: true,
                order: { select: { orderNumber: true } },
              },
            },
          },
        },
        // Активные задачи из Task-системы
        tasks: {
          where: {
            status: { in: ["ACCEPTED", "NEW"] },
            isDefect: false,
          },
          select: {
            stage: true,
            acceptedAt: true,
            product: {
              select: {
                name: true,
                order: { select: { orderNumber: true } },
              },
            },
          },
          take: 1,
          orderBy: { acceptedAt: "desc" },
        },
      },
    });

    const userStats = users.map((user) => {
      const completedHistory = user.productHistory.filter(
        (h) => h.completedAt !== null,
      );

      // Активная задача: сначала ищем незакрытую productHistory (старый flow),
      // затем ищем Task со статусом ACCEPTED/NEW (новый flow)
      const activeHistory = user.productHistory.find(
        (h) => h.completedAt === null,
      );
      const activeTask = user.tasks[0] ?? null;

      let avgTaskDuration = 0;
      if (completedHistory.length > 0) {
        const totalDuration = completedHistory.reduce((sum, task) => {
          if (!task.completedAt) return sum;
          return sum + (task.completedAt.getTime() - task.startedAt.getTime());
        }, 0);
        avgTaskDuration = Math.round(
          totalDuration / completedHistory.length / 1000 / 60 / 60,
        );
      }

      const resolvedActive = activeHistory ?? activeTask;

      return {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        },
        stats: {
          completedTasks: completedHistory.length,
          avgTaskDurationHours: avgTaskDuration,
          hasActiveTask: !!resolvedActive,
          activeTask: resolvedActive
            ? {
                productName: resolvedActive.product.name,
                orderNumber: resolvedActive.product.order.orderNumber,
                stage: resolvedActive.stage,
                startedAt:
                  "startedAt" in resolvedActive
                    ? resolvedActive.startedAt
                    : (resolvedActive.acceptedAt ?? new Date()),
              }
            : null,
        },
      };
    });

    return userStats;
  }

  // Статистика проверки качества
  async getQualityStats() {
    const [
      totalChecks,
      approvedChecks,
      rejectedChecks,
      pendingChecks,
      recentRejections,
    ] = await Promise.all([
      this.prisma.qualityCheck.count(),

      this.prisma.qualityCheck.count({
        where: { status: QualityStatus.APPROVED },
      }),

      this.prisma.qualityCheck.count({
        where: { status: QualityStatus.REJECTED },
      }),

      this.prisma.qualityCheck.count({
        where: { status: QualityStatus.PENDING },
      }),

      // Последние браки
      this.prisma.qualityCheck.findMany({
        where: { status: QualityStatus.REJECTED },
        take: 10,
        orderBy: { checkedAt: "desc" },
        include: {
          product: {
            select: {
              name: true,
              order: {
                select: {
                  orderNumber: true,
                  customerName: true,
                },
              },
            },
          },
          checkedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    const approvalRate =
      totalChecks > 0 ? ((approvedChecks / totalChecks) * 100).toFixed(1) : "0";

    return {
      total: totalChecks,
      approved: approvedChecks,
      rejected: rejectedChecks,
      pending: pendingChecks,
      approvalRate,
      recentRejections: recentRejections.map((check) => ({
        id: check.id,
        productName: check.product.name,
        orderNumber: check.product.order.orderNumber,
        customerName: check.product.order.customerName,
        reason: check.notes,
        checkedBy: check.checkedBy
          ? `${check.checkedBy.firstName} ${check.checkedBy.lastName}`
          : "Не указан",
        checkedAt: check.checkedAt,
      })),
    };
  }

  // Статистика по типам продуктов (оптимизированный)
  async getProductTypeStats() {
    // Получаем типы продуктов с продуктами одним запросом
    const productTypes = await this.prisma.productType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        products: {
          select: {
            stage: true,
          },
        },
      },
    });

    // Обрабатываем в памяти без дополнительных запросов
    const typeStats = productTypes.map((type) => {
      const products = type.products;
      const total = products.length;
      const completed = products.filter(
        (p) => p.stage === ProductionStage.COMPLETED,
      ).length;
      const excludedStages: ProductionStage[] = [
        ProductionStage.PENDING,
        ProductionStage.COMPLETED,
        ProductionStage.REJECTED,
      ];
      const inProduction = products.filter(
        (p) => !excludedStages.includes(p.stage),
      ).length;
      const rejected = products.filter(
        (p) => p.stage === ProductionStage.REJECTED,
      ).length;

      return {
        type: type.name,
        total,
        completed,
        inProduction,
        rejected,
        completionRate:
          total > 0 ? ((completed / total) * 100).toFixed(1) : "0",
      };
    });

    return typeStats;
  }

  // Сводка за период
  async getPerformanceSummary(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
    const end = endDate || new Date();

    const [
      ordersCreated,
      ordersCompleted,
      productsCompleted,
      qualityChecksPerformed,
    ] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      this.prisma.order.count({
        where: {
          updatedAt: {
            gte: start,
            lte: end,
          },
          status: OrderStatus.COMPLETED,
        },
      }),

      this.prisma.product.count({
        where: {
          updatedAt: {
            gte: start,
            lte: end,
          },
          stage: ProductionStage.COMPLETED,
        },
      }),

      this.prisma.qualityCheck.count({
        where: {
          checkedAt: {
            gte: start,
            lte: end,
            not: null,
          },
        },
      }),
    ]);

    return {
      period: {
        start,
        end,
        days: Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        ),
      },
      ordersCreated,
      ordersCompleted,
      productsCompleted,
      qualityChecksPerformed,
      avgProductsPerDay:
        productsCompleted /
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  // Полная аналитика цикла: от заказа до доставки
  async getFullCycleAnalytics(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Получаем доставленные отгрузки за период
    const deliveredShipments = await this.prisma.shipment.findMany({
      where: {
        status: ShipmentStatus.DELIVERED,
        updatedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                product: {
                  include: {
                    order: true,
                    productType: true,
                    history: {
                      orderBy: {
                        startedAt: "asc",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Статистика по завершенным циклам
    const cycleStats = deliveredShipments.flatMap((shipment) =>
      shipment.items.map((item) => {
        const product = item.inventoryItem.product!;
        const order = product.order!;
        const history = product.history;

        // Время от создания заказа до доставки (полный цикл)
        const fullCycleDuration =
          shipment.updatedAt.getTime() - order.createdAt.getTime();

        // Время производства (от первого этапа до завершения)
        const productionStart =
          history.length > 0 ? history[0].startedAt : product.createdAt;
        const productionEnd =
          history.find((h) => h.stage === ProductionStage.COMPLETED)
            ?.completedAt || product.updatedAt;
        const productionDuration =
          productionEnd.getTime() - productionStart.getTime();

        // Время на складе (от завершения производства до отгрузки)
        const warehouseStart = productionEnd;
        const warehouseEnd = shipment.createdAt;
        const warehouseDuration =
          warehouseEnd.getTime() - warehouseStart.getTime();

        // Время доставки (от отгрузки до доставки)
        const deliveryDuration =
          shipment.updatedAt.getTime() - shipment.createdAt.getTime();

        // Время по этапам производства
        const stagesDuration: Record<string, number> = {};
        history.forEach((h) => {
          if (h.completedAt) {
            const duration = h.completedAt.getTime() - h.startedAt.getTime();
            stagesDuration[h.stage] = (stagesDuration[h.stage] || 0) + duration;
          }
        });

        return {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          productName: product.name,
          productType: product.productType?.name || "Не указан",
          quantity: item.quantity,
          orderCreatedAt: order.createdAt,
          deliveredAt: shipment.updatedAt,
          // Длительности в часах
          durations: {
            fullCycleHours:
              Math.round((fullCycleDuration / 1000 / 60 / 60) * 10) / 10,
            productionHours:
              Math.round((productionDuration / 1000 / 60 / 60) * 10) / 10,
            warehouseHours:
              Math.round((warehouseDuration / 1000 / 60 / 60) * 10) / 10,
            deliveryHours:
              Math.round((deliveryDuration / 1000 / 60 / 60) * 10) / 10,
            stageHours: Object.entries(stagesDuration).reduce(
              (acc, [stage, duration]) => {
                acc[stage] = Math.round((duration / 1000 / 60 / 60) * 10) / 10;
                return acc;
              },
              {} as Record<string, number>,
            ),
          },
        };
      }),
    );

    // Средние показатели
    const avgFullCycle =
      cycleStats.length > 0
        ? cycleStats.reduce(
            (sum, stat) => sum + stat.durations.fullCycleHours,
            0,
          ) / cycleStats.length
        : 0;

    const avgProduction =
      cycleStats.length > 0
        ? cycleStats.reduce(
            (sum, stat) => sum + stat.durations.productionHours,
            0,
          ) / cycleStats.length
        : 0;

    const avgWarehouse =
      cycleStats.length > 0
        ? cycleStats.reduce(
            (sum, stat) => sum + stat.durations.warehouseHours,
            0,
          ) / cycleStats.length
        : 0;

    const avgDelivery =
      cycleStats.length > 0
        ? cycleStats.reduce(
            (sum, stat) => sum + stat.durations.deliveryHours,
            0,
          ) / cycleStats.length
        : 0;

    // Средние показатели по этапам — динамически из WorkflowStage
    const workflowStages = await this.prisma.workflowStage.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { legacyStage: true },
    });
    const allStages = workflowStages.map(
      (s) => s.legacyStage as ProductionStage,
    );

    const avgStages: Record<string, number> = {};
    allStages.forEach((stage) => {
      const stageData = cycleStats
        .map((stat) => stat.durations.stageHours[stage] || 0)
        .filter((val) => val > 0);
      avgStages[stage] =
        stageData.length > 0
          ? stageData.reduce((sum, val) => sum + val, 0) / stageData.length
          : 0;
    });

    // Статистика текущих заказов в работе
    const ordersInProgress = await this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.NEW, OrderStatus.IN_PRODUCTION],
        },
      },
      include: {
        products: {
          include: {
            productType: true,
            history: {
              orderBy: {
                startedAt: "asc",
              },
            },
          },
        },
      },
    });

    const inProgressStats = ordersInProgress.map((order) => {
      const currentDuration = Date.now() - order.createdAt.getTime();
      const products = order.products;

      const completedProducts = products.filter(
        (p) => p.stage === ProductionStage.COMPLETED,
      ).length;
      const totalProducts = products.length;

      return {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        createdAt: order.createdAt,
        currentDurationHours:
          Math.round((currentDuration / 1000 / 60 / 60) * 10) / 10,
        totalProducts,
        completedProducts,
        completionPercent:
          totalProducts > 0
            ? Math.round((completedProducts / totalProducts) * 100)
            : 0,
        products: products.map((p) => ({
          name: p.name,
          type: p.productType?.name || "Не указан",
          stage: p.stage,
          quantity: p.quantity,
        })),
      };
    });

    return {
      period: {
        start,
        end,
        days: Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        ),
      },
      summary: {
        totalDelivered: cycleStats.length,
        avgFullCycleHours: Math.round(avgFullCycle * 10) / 10,
        avgProductionHours: Math.round(avgProduction * 10) / 10,
        avgWarehouseHours: Math.round(avgWarehouse * 10) / 10,
        avgDeliveryHours: Math.round(avgDelivery * 10) / 10,
        avgStageHours: Object.entries(avgStages).reduce(
          (acc, [stage, hours]) => {
            acc[stage] = Math.round(hours * 10) / 10;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      completedCycles: cycleStats.sort(
        (a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime(),
      ),
      ordersInProgress: inProgressStats.sort(
        (a, b) => b.currentDurationHours - a.currentDurationHours,
      ),
    };
  }

  // Отчёт производительности сотрудников (коэффициент полезности)
  async getProductivityReport(startDate?: Date, endDate?: Date) {
    const start =
      startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date();

    // Рабочих дней в периоде (пн-пт)
    const workingDays = this.countWorkingDays(start, end);

    // Получаем всех активных производственников
    const workers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { code: { notIn: ["SUPER_ADMIN", "MANAGER", "OWNER"] } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        paymentType: true,
        monthlySalary: true,
        role: { select: { name: true, code: true, color: true } },
      },
    });

    // Получаем work_logs за период по всем работникам
    const workLogs = await this.prisma.workLog.groupBy({
      by: ["userId"],
      where: {
        completedAt: { gte: start, lte: end },
      },
      _sum: { quantity: true, totalAmount: true },
      _count: { id: true },
    });

    const logMap = new Map(workLogs.map((l) => [l.userId, l]));

    // Детали по этапам
    const stageDetails = await this.prisma.workLog.groupBy({
      by: ["userId", "stage"],
      where: { completedAt: { gte: start, lte: end } },
      _sum: { quantity: true },
    });

    const stageMap = new Map<string, Record<string, number>>();
    for (const s of stageDetails) {
      if (!stageMap.has(s.userId)) stageMap.set(s.userId, {});
      stageMap.get(s.userId)![s.stage] = s._sum.quantity || 0;
    }

    const report = workers.map((worker) => {
      const logs = logMap.get(worker.id);
      const itemsMade = logs?._sum?.quantity || 0;
      const earnedAmount = logs?._sum?.totalAmount || 0;
      const tasksCompleted = logs?._count?.id || 0;

      // Коэффициент полезности = изделий в день (за рабочие дни периода)
      const coefficient =
        workingDays > 0 ? Math.round((itemsMade / workingDays) * 100) / 100 : 0;

      return {
        worker: {
          id: worker.id,
          name: `${worker.firstName} ${worker.lastName}`,
          role: worker.role,
          paymentType: worker.paymentType,
          monthlySalary: worker.monthlySalary,
        },
        stats: {
          itemsMade,
          tasksCompleted,
          earnedAmount: worker.paymentType === "SALARY" ? 0 : earnedAmount,
          coefficient, // изделий/рабочий день
          workingDays,
          stageBreakdown: stageMap.get(worker.id) || {},
        },
      };
    });

    // Сортировка: сначала окладники, потом сдельники — по убыванию коэффициента
    report.sort((a, b) => {
      if (a.worker.paymentType !== b.worker.paymentType) {
        return a.worker.paymentType === "SALARY" ? -1 : 1;
      }
      return b.stats.coefficient - a.stats.coefficient;
    });

    return {
      period: { start, end, workingDays },
      totalWorkers: workers.length,
      salaryWorkers: workers.filter((w) => w.paymentType === "SALARY").length,
      pieceRateWorkers: workers.filter((w) => w.paymentType === "PIECE_RATE")
        .length,
      workers: report,
    };
  }

  // Детальный отчёт по заказам: для каждого заказа — продукты и сотрудники, которые
  // участвовали в производстве каждого этапа (из ProductHistory)
  async getOrderProductionReport(start?: Date, end?: Date) {
    const where: any = {};
    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = start;
      if (end) where.createdAt.lte = end;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        products: {
          include: {
            productType: { select: { id: true, name: true } },
            history: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: { select: { code: true, name: true } },
                  },
                },
                workflowStage: { select: { id: true, name: true, order: true } },
              },
              orderBy: { startedAt: "asc" },
            },
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      createdBy: order.createdBy
        ? `${order.createdBy.firstName} ${order.createdBy.lastName}`
        : null,
      products: order.products.map((product) => {
        const stagesMap = new Map<
          string,
          {
            stage: string;
            stageName: string;
            stageOrder: number | null;
            workers: Array<{
              id: string;
              name: string;
              role: string | null;
              status: string;
              startedAt: Date;
              completedAt: Date | null;
              durationHours: number | null;
            }>;
          }
        >();

        for (const entry of product.history) {
          const key = entry.workflowStage
            ? `wf:${entry.workflowStage.id}`
            : `legacy:${entry.stage}`;
          if (!stagesMap.has(key)) {
            stagesMap.set(key, {
              stage: entry.stage,
              stageName: entry.workflowStage?.name || entry.stage,
              stageOrder: entry.workflowStage?.order ?? null,
              workers: [],
            });
          }
          const bucket = stagesMap.get(key)!;
          const durationHours =
            entry.completedAt && entry.startedAt
              ? Math.round(
                  ((entry.completedAt.getTime() -
                    entry.startedAt.getTime()) /
                    3600000) *
                    10,
                ) / 10
              : null;
          bucket.workers.push({
            id: entry.user.id,
            name: `${entry.user.firstName} ${entry.user.lastName}`.trim(),
            role:
              (entry.user.role as any)?.name ||
              (typeof entry.user.role === "string" ? entry.user.role : null),
            status: entry.status,
            startedAt: entry.startedAt,
            completedAt: entry.completedAt,
            durationHours,
          });
        }

        const stages = Array.from(stagesMap.values()).sort((a, b) => {
          const ao = a.stageOrder ?? 999;
          const bo = b.stageOrder ?? 999;
          return ao - bo;
        });

        return {
          id: product.id,
          name: product.name,
          productType: product.productType?.name || null,
          quantity: product.quantity,
          stage: product.stage,
          color: product.color,
          dimensions: product.dimensions,
          stages,
        };
      }),
    }));
  }

  // Подсчёт рабочих дней (пн-пт) в периоде
  private countWorkingDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count || 1; // минимум 1 чтобы не делить на 0
  }
}
