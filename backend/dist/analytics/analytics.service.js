"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProductionOverview() {
        const [totalOrders, activeOrders, completedOrders, totalProducts, productsInProduction, completedProducts, rejectedProducts, pendingQualityChecks,] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({
                where: {
                    status: {
                        in: [client_1.OrderStatus.NEW, client_1.OrderStatus.IN_PRODUCTION],
                    },
                },
            }),
            this.prisma.order.count({
                where: { status: client_1.OrderStatus.COMPLETED },
            }),
            this.prisma.product.count(),
            this.prisma.product.count({
                where: {
                    stage: {
                        notIn: [client_1.ProductionStage.PENDING, client_1.ProductionStage.COMPLETED, client_1.ProductionStage.REJECTED],
                    },
                },
            }),
            this.prisma.product.count({
                where: { stage: client_1.ProductionStage.COMPLETED },
            }),
            this.prisma.qualityCheck.groupBy({
                by: ['productId'],
                where: { status: client_1.QualityStatus.REJECTED },
            }).then(result => result.length),
            this.prisma.product.count({
                where: { stage: client_1.ProductionStage.QUALITY_CHECK },
            }),
        ]);
        const productsByStage = await this.prisma.product.groupBy({
            by: ['stage'],
            _count: true,
        });
        const stageStats = productsByStage.reduce((acc, item) => {
            acc[item.stage] = item._count;
            return acc;
        }, {});
        return {
            orders: {
                total: totalOrders,
                active: activeOrders,
                completed: completedOrders,
                completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0',
            },
            products: {
                total: totalProducts,
                inProduction: productsInProduction,
                completed: completedProducts,
                rejected: rejectedProducts,
                pendingQualityCheck: pendingQualityChecks,
                completionRate: totalProducts > 0 ? ((completedProducts / totalProducts) * 100).toFixed(1) : '0',
            },
            stageDistribution: stageStats,
        };
    }
    async getUserPerformance() {
        const users = await this.prisma.user.findMany({
            where: {
                isActive: true,
                role: { code: { not: 'SUPER_ADMIN' } },
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
                                order: {
                                    select: {
                                        orderNumber: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const userStats = users.map((user) => {
            const completedHistory = user.productHistory.filter(h => h.completedAt !== null);
            const activeHistory = user.productHistory.find(h => h.completedAt === null);
            let avgTaskDuration = 0;
            if (completedHistory.length > 0) {
                const totalDuration = completedHistory.reduce((sum, task) => {
                    if (!task.completedAt)
                        return sum;
                    return sum + (task.completedAt.getTime() - task.startedAt.getTime());
                }, 0);
                avgTaskDuration = Math.round(totalDuration / completedHistory.length / 1000 / 60 / 60);
            }
            return {
                user: {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                },
                stats: {
                    completedTasks: completedHistory.length,
                    avgTaskDurationHours: avgTaskDuration,
                    hasActiveTask: !!activeHistory,
                    activeTask: activeHistory ? {
                        productName: activeHistory.product.name,
                        orderNumber: activeHistory.product.order.orderNumber,
                        stage: activeHistory.stage,
                        startedAt: activeHistory.startedAt,
                    } : null,
                },
            };
        });
        return userStats;
    }
    async getQualityStats() {
        const [totalChecks, approvedChecks, rejectedChecks, pendingChecks, recentRejections,] = await Promise.all([
            this.prisma.qualityCheck.count(),
            this.prisma.qualityCheck.count({
                where: { status: client_1.QualityStatus.APPROVED },
            }),
            this.prisma.qualityCheck.count({
                where: { status: client_1.QualityStatus.REJECTED },
            }),
            this.prisma.qualityCheck.count({
                where: { status: client_1.QualityStatus.PENDING },
            }),
            this.prisma.qualityCheck.findMany({
                where: { status: client_1.QualityStatus.REJECTED },
                take: 10,
                orderBy: { checkedAt: 'desc' },
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
        const approvalRate = totalChecks > 0
            ? ((approvedChecks / totalChecks) * 100).toFixed(1)
            : '0';
        return {
            total: totalChecks,
            approved: approvedChecks,
            rejected: rejectedChecks,
            pending: pendingChecks,
            approvalRate,
            recentRejections: recentRejections.map(check => ({
                id: check.id,
                productName: check.product.name,
                orderNumber: check.product.order.orderNumber,
                customerName: check.product.order.customerName,
                reason: check.notes,
                checkedBy: check.checkedBy
                    ? `${check.checkedBy.firstName} ${check.checkedBy.lastName}`
                    : 'Не указан',
                checkedAt: check.checkedAt,
            })),
        };
    }
    async getProductTypeStats() {
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
        const typeStats = productTypes.map((type) => {
            const products = type.products;
            const total = products.length;
            const completed = products.filter(p => p.stage === client_1.ProductionStage.COMPLETED).length;
            const excludedStages = [client_1.ProductionStage.PENDING, client_1.ProductionStage.COMPLETED, client_1.ProductionStage.REJECTED];
            const inProduction = products.filter(p => !excludedStages.includes(p.stage)).length;
            const rejected = products.filter(p => p.stage === client_1.ProductionStage.REJECTED).length;
            return {
                type: type.name,
                total,
                completed,
                inProduction,
                rejected,
                completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
            };
        });
        return typeStats;
    }
    async getPerformanceSummary(startDate, endDate) {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate || new Date();
        const [ordersCreated, ordersCompleted, productsCompleted, qualityChecksPerformed,] = await Promise.all([
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
                    status: client_1.OrderStatus.COMPLETED,
                },
            }),
            this.prisma.product.count({
                where: {
                    updatedAt: {
                        gte: start,
                        lte: end,
                    },
                    stage: client_1.ProductionStage.COMPLETED,
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
                days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
            },
            ordersCreated,
            ordersCompleted,
            productsCompleted,
            qualityChecksPerformed,
            avgProductsPerDay: productsCompleted / Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        };
    }
    async getFullCycleAnalytics(startDate, endDate) {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate || new Date();
        const deliveredShipments = await this.prisma.shipment.findMany({
            where: {
                status: client_1.ShipmentStatus.DELIVERED,
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
                                                startedAt: 'asc',
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
        const cycleStats = deliveredShipments.flatMap(shipment => shipment.items.map(item => {
            const product = item.inventoryItem.product;
            const order = product.order;
            const history = product.history;
            const fullCycleDuration = shipment.updatedAt.getTime() - order.createdAt.getTime();
            const productionStart = history.length > 0 ? history[0].startedAt : product.createdAt;
            const productionEnd = history.find(h => h.stage === client_1.ProductionStage.COMPLETED)?.completedAt || product.updatedAt;
            const productionDuration = productionEnd.getTime() - productionStart.getTime();
            const warehouseStart = productionEnd;
            const warehouseEnd = shipment.createdAt;
            const warehouseDuration = warehouseEnd.getTime() - warehouseStart.getTime();
            const deliveryDuration = shipment.updatedAt.getTime() - shipment.createdAt.getTime();
            const stagesDuration = {};
            history.forEach(h => {
                if (h.completedAt) {
                    const duration = h.completedAt.getTime() - h.startedAt.getTime();
                    stagesDuration[h.stage] = (stagesDuration[h.stage] || 0) + duration;
                }
            });
            return {
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                productName: product.name,
                productType: product.productType?.name || 'Не указан',
                quantity: item.quantity,
                orderCreatedAt: order.createdAt,
                deliveredAt: shipment.updatedAt,
                durations: {
                    fullCycleHours: Math.round(fullCycleDuration / 1000 / 60 / 60 * 10) / 10,
                    productionHours: Math.round(productionDuration / 1000 / 60 / 60 * 10) / 10,
                    warehouseHours: Math.round(warehouseDuration / 1000 / 60 / 60 * 10) / 10,
                    deliveryHours: Math.round(deliveryDuration / 1000 / 60 / 60 * 10) / 10,
                    stageHours: Object.entries(stagesDuration).reduce((acc, [stage, duration]) => {
                        acc[stage] = Math.round(duration / 1000 / 60 / 60 * 10) / 10;
                        return acc;
                    }, {}),
                },
            };
        }));
        const avgFullCycle = cycleStats.length > 0
            ? cycleStats.reduce((sum, stat) => sum + stat.durations.fullCycleHours, 0) / cycleStats.length
            : 0;
        const avgProduction = cycleStats.length > 0
            ? cycleStats.reduce((sum, stat) => sum + stat.durations.productionHours, 0) / cycleStats.length
            : 0;
        const avgWarehouse = cycleStats.length > 0
            ? cycleStats.reduce((sum, stat) => sum + stat.durations.warehouseHours, 0) / cycleStats.length
            : 0;
        const avgDelivery = cycleStats.length > 0
            ? cycleStats.reduce((sum, stat) => sum + stat.durations.deliveryHours, 0) / cycleStats.length
            : 0;
        const workflowStages = await this.prisma.workflowStage.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: { legacyStage: true },
        });
        const allStages = workflowStages.map(s => s.legacyStage);
        const avgStages = {};
        allStages.forEach(stage => {
            const stageData = cycleStats
                .map(stat => stat.durations.stageHours[stage] || 0)
                .filter(val => val > 0);
            avgStages[stage] = stageData.length > 0
                ? stageData.reduce((sum, val) => sum + val, 0) / stageData.length
                : 0;
        });
        const ordersInProgress = await this.prisma.order.findMany({
            where: {
                status: {
                    in: [client_1.OrderStatus.NEW, client_1.OrderStatus.IN_PRODUCTION],
                },
            },
            include: {
                products: {
                    include: {
                        productType: true,
                        history: {
                            orderBy: {
                                startedAt: 'asc',
                            },
                        },
                    },
                },
            },
        });
        const inProgressStats = ordersInProgress.map(order => {
            const currentDuration = Date.now() - order.createdAt.getTime();
            const products = order.products;
            const completedProducts = products.filter(p => p.stage === client_1.ProductionStage.COMPLETED).length;
            const totalProducts = products.length;
            return {
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                createdAt: order.createdAt,
                currentDurationHours: Math.round(currentDuration / 1000 / 60 / 60 * 10) / 10,
                totalProducts,
                completedProducts,
                completionPercent: totalProducts > 0 ? Math.round((completedProducts / totalProducts) * 100) : 0,
                products: products.map(p => ({
                    name: p.name,
                    type: p.productType?.name || 'Не указан',
                    stage: p.stage,
                    quantity: p.quantity,
                })),
            };
        });
        return {
            period: {
                start,
                end,
                days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
            },
            summary: {
                totalDelivered: cycleStats.length,
                avgFullCycleHours: Math.round(avgFullCycle * 10) / 10,
                avgProductionHours: Math.round(avgProduction * 10) / 10,
                avgWarehouseHours: Math.round(avgWarehouse * 10) / 10,
                avgDeliveryHours: Math.round(avgDelivery * 10) / 10,
                avgStageHours: Object.entries(avgStages).reduce((acc, [stage, hours]) => {
                    acc[stage] = Math.round(hours * 10) / 10;
                    return acc;
                }, {}),
            },
            completedCycles: cycleStats.sort((a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime()),
            ordersInProgress: inProgressStats.sort((a, b) => b.currentDurationHours - a.currentDurationHours),
        };
    }
    async getProductivityReport(startDate, endDate) {
        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate || new Date();
        const workingDays = this.countWorkingDays(start, end);
        const workers = await this.prisma.user.findMany({
            where: {
                isActive: true,
                role: { code: { notIn: ['SUPER_ADMIN', 'MANAGER', 'OWNER'] } },
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
        const workLogs = await this.prisma.workLog.groupBy({
            by: ['userId'],
            where: {
                completedAt: { gte: start, lte: end },
            },
            _sum: { quantity: true, totalAmount: true },
            _count: { id: true },
        });
        const logMap = new Map(workLogs.map(l => [l.userId, l]));
        const stageDetails = await this.prisma.workLog.groupBy({
            by: ['userId', 'stage'],
            where: { completedAt: { gte: start, lte: end } },
            _sum: { quantity: true },
        });
        const stageMap = new Map();
        for (const s of stageDetails) {
            if (!stageMap.has(s.userId))
                stageMap.set(s.userId, {});
            stageMap.get(s.userId)[s.stage] = s._sum.quantity || 0;
        }
        const report = workers.map(worker => {
            const logs = logMap.get(worker.id);
            const itemsMade = logs?._sum?.quantity || 0;
            const earnedAmount = logs?._sum?.totalAmount || 0;
            const tasksCompleted = logs?._count?.id || 0;
            const coefficient = workingDays > 0
                ? Math.round((itemsMade / workingDays) * 100) / 100
                : 0;
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
                    earnedAmount: worker.paymentType === 'SALARY' ? 0 : earnedAmount,
                    coefficient,
                    workingDays,
                    stageBreakdown: stageMap.get(worker.id) || {},
                },
            };
        });
        report.sort((a, b) => {
            if (a.worker.paymentType !== b.worker.paymentType) {
                return a.worker.paymentType === 'SALARY' ? -1 : 1;
            }
            return b.stats.coefficient - a.stats.coefficient;
        });
        return {
            period: { start, end, workingDays },
            totalWorkers: workers.length,
            salaryWorkers: workers.filter(w => w.paymentType === 'SALARY').length,
            pieceRateWorkers: workers.filter(w => w.paymentType === 'PIECE_RATE').length,
            workers: report,
        };
    }
    countWorkingDays(start, end) {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6)
                count++;
            current.setDate(current.getDate() + 1);
        }
        return count || 1;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map