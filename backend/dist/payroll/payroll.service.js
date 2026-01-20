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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PayrollService = class PayrollService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async findWorkRate(productTypeId, stage) {
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
    async createWorkRate(dto) {
        const existing = await this.prisma.workRate.findUnique({
            where: {
                productTypeId_stage: { productTypeId: dto.productTypeId, stage: dto.stage },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Расценка для типа продукта и этапа "${dto.stage}" уже существует`);
        }
        return this.prisma.workRate.create({
            data: dto,
            include: {
                productType: true,
                workflowStage: true,
            },
        });
    }
    async updateWorkRate(id, dto) {
        return this.prisma.workRate.update({
            where: { id },
            data: dto,
            include: {
                productType: true,
                workflowStage: true,
            },
        });
    }
    async deleteWorkRate(id) {
        await this.prisma.workRate.delete({ where: { id } });
        return { success: true };
    }
    async findAllPenalties(filters) {
        const where = {};
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
    async createPenalty(dto, createdById) {
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
    async updatePenalty(id, dto) {
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
    async cancelPenalty(id, cancelledById, notes) {
        const penalty = await this.prisma.penalty.findUnique({ where: { id } });
        if (!penalty) {
            throw new common_1.NotFoundException(`Штраф с ID ${id} не найден`);
        }
        if (penalty.isCancelled) {
            throw new common_1.BadRequestException('Штраф уже отменен');
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
    async findManagerCommission(userId) {
        let commission = await this.prisma.managerCommission.findUnique({
            where: { userId },
            include: { user: true, role: true },
        });
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
    async createManagerCommission(dto) {
        if (dto.userId) {
            const existing = await this.prisma.managerCommission.findUnique({
                where: { userId: dto.userId },
            });
            if (existing) {
                throw new common_1.ConflictException('Настройки комиссии для этого пользователя уже существуют');
            }
        }
        return this.prisma.managerCommission.create({
            data: dto,
            include: { user: true, role: true },
        });
    }
    async updateManagerCommission(id, dto) {
        return this.prisma.managerCommission.update({
            where: { id },
            data: dto,
            include: { user: true, role: true },
        });
    }
    async deleteManagerCommission(id) {
        await this.prisma.managerCommission.delete({ where: { id } });
        return { success: true };
    }
    async findAllPayrollPeriods(filters) {
        const where = {};
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.periodStart) {
            where.periodStart = { gte: new Date(filters.periodStart) };
        }
        if (filters?.periodEnd) {
            where.periodEnd = { lte: new Date(filters.periodEnd) };
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
    async findPayrollPeriod(id) {
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
            throw new common_1.NotFoundException(`Расчетный период с ID ${id} не найден`);
        }
        return period;
    }
    async calculatePayrollForUser(userId, periodStart, periodEnd) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException(`Пользователь с ID ${userId} не найден`);
        }
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
            throw new common_1.ConflictException('Расчет за этот период уже существует');
        }
        const workLogs = await this.prisma.workLog.findMany({
            where: {
                userId,
                completedAt: {
                    gte: periodStart,
                    lte: periodEnd,
                },
                payrollPeriodId: null,
            },
        });
        const workAmount = workLogs.reduce((sum, log) => sum + log.totalAmount, 0);
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
        let baseSalary = 0;
        let commissionAmount = 0;
        let ordersAmount = 0;
        const commission = await this.findManagerCommission(userId);
        if (commission) {
            baseSalary = commission.baseSalary;
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
        const totalAmount = baseSalary + workAmount + commissionAmount - penaltyAmount;
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
                    status: client_1.PayrollStatus.DRAFT,
                },
            });
            if (workLogs.length > 0) {
                await tx.workLog.updateMany({
                    where: {
                        id: { in: workLogs.map((w) => w.id) },
                    },
                    data: { payrollPeriodId: period.id },
                });
            }
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
    async calculatePayrollForAll(dto) {
        const periodStart = new Date(dto.periodStart);
        const periodEnd = new Date(dto.periodEnd);
        let users;
        if (dto.userId) {
            users = [{ id: dto.userId }];
        }
        else {
            users = await this.prisma.user.findMany({
                where: { isActive: true },
                select: { id: true },
            });
        }
        const results = [];
        for (const user of users) {
            try {
                const period = await this.calculatePayrollForUser(user.id, periodStart, periodEnd);
                results.push({ userId: user.id, success: true, period });
            }
            catch (error) {
                results.push({
                    userId: user.id,
                    success: false,
                    error: error.message,
                });
            }
        }
        return results;
    }
    async approvePayrollPeriod(id, approvedById, notes) {
        const period = await this.findPayrollPeriod(id);
        if (period.status !== client_1.PayrollStatus.DRAFT) {
            throw new common_1.BadRequestException('Можно утвердить только черновик');
        }
        return this.prisma.payrollPeriod.update({
            where: { id },
            data: {
                status: client_1.PayrollStatus.APPROVED,
                approvedById,
                approvedAt: new Date(),
                notes: notes || period.notes,
            },
            include: { user: true },
        });
    }
    async markPayrollAsPaid(id, paidById, notes) {
        const period = await this.findPayrollPeriod(id);
        if (period.status !== client_1.PayrollStatus.APPROVED) {
            throw new common_1.BadRequestException('Можно выплатить только утвержденный расчет');
        }
        return this.prisma.payrollPeriod.update({
            where: { id },
            data: {
                status: client_1.PayrollStatus.PAID,
                paidById,
                paidAt: new Date(),
                notes: notes || period.notes,
            },
            include: { user: true },
        });
    }
    async cancelPayrollPeriod(id) {
        const period = await this.findPayrollPeriod(id);
        if (period.status === client_1.PayrollStatus.PAID) {
            throw new common_1.BadRequestException('Нельзя отменить уже выплаченный расчет');
        }
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
                data: { status: client_1.PayrollStatus.CANCELLED },
            }),
        ]);
        return { success: true };
    }
    async deletePayrollPeriod(id) {
        const period = await this.findPayrollPeriod(id);
        if (period.status !== client_1.PayrollStatus.DRAFT && period.status !== client_1.PayrollStatus.CANCELLED) {
            throw new common_1.BadRequestException('Можно удалить только черновик или отмененный расчет');
        }
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
    async createWorkLog(data) {
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
    async findWorkLogs(filters) {
        const where = {};
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
    async getPayrollSummary(periodStart, periodEnd) {
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        const workLogsByUser = await this.prisma.workLog.groupBy({
            by: ['userId'],
            where: {
                completedAt: { gte: start, lte: end },
            },
            _sum: { totalAmount: true },
            _count: true,
        });
        const penaltiesByUser = await this.prisma.penalty.groupBy({
            by: ['userId'],
            where: {
                date: { gte: start, lte: end },
                isCancelled: false,
            },
            _sum: { amount: true },
        });
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
        const users = usersData.map((user) => {
            const workData = workLogsByUser.find((w) => w.userId === user.id);
            const penaltyData = penaltiesByUser.find((p) => p.userId === user.id);
            const workAmount = workData?._sum.totalAmount || 0;
            const penaltyAmount = penaltyData?._sum.amount || 0;
            const commissionAmount = 0;
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
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map