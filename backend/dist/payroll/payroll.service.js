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
var PayrollService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const client_1 = require("@prisma/client");
let PayrollService = PayrollService_1 = class PayrollService {
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.logger = new common_1.Logger(PayrollService_1.name);
    }
    async findAllWorkRates() {
        return this.prisma.workRate.findMany({
            include: {
                productType: true,
                nomenclature: true,
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
                nomenclature: true,
                workflowStage: true,
            },
            orderBy: [
                { productType: { name: 'asc' } },
                { stage: 'asc' },
            ],
        });
    }
    async findWorkRate(productTypeId, stage, nomenclatureId) {
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
            if (byNomenclature)
                return byNomenclature;
        }
        return this.prisma.workRate.findFirst({
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
    }
    async createWorkRate(dto) {
        const existing = await this.prisma.workRate.findFirst({
            where: {
                productTypeId: dto.productTypeId,
                stage: dto.stage,
                nomenclatureId: dto.nomenclatureId || null,
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Расценка для этого изделия и этапа "${dto.stage}" уже существует`);
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
                const d = new Date(filters.startDate);
                if (!isNaN(d.getTime()))
                    where.date.gte = d;
            }
            if (filters.endDate) {
                const d = new Date(filters.endDate);
                if (!isNaN(d.getTime()))
                    where.date.lte = d;
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
        try {
            const createdByName = penalty.createdBy
                ? `${penalty.createdBy.lastName} ${penalty.createdBy.firstName}`
                : 'Система';
            await this.telegramService.sendPenaltyNotification({
                userId: dto.userId,
                amount: dto.amount,
                reason: dto.reason,
                createdByName,
            });
        }
        catch (error) {
            this.logger.error('Failed to send penalty Telegram notification', error);
        }
        return penalty;
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
        if (penalty.payrollPeriodId) {
            const period = await this.prisma.payrollPeriod.findUnique({
                where: { id: penalty.payrollPeriodId },
            });
            if (period?.status === client_1.PayrollStatus.PAID) {
                throw new common_1.BadRequestException('Нельзя отменить штраф, включённый в выплаченный расчёт');
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
            const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
            if (!user) {
                throw new common_1.NotFoundException('Пользователь не найден');
            }
            const existing = await this.prisma.managerCommission.findUnique({
                where: { userId: dto.userId },
            });
            if (existing) {
                throw new common_1.ConflictException('Настройки комиссии для этого пользователя уже существуют');
            }
        }
        if (dto.roleId) {
            const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
            if (!role) {
                throw new common_1.NotFoundException('Роль не найдена');
            }
        }
        if (!dto.userId && !dto.roleId) {
            throw new common_1.BadRequestException('Необходимо указать userId или roleId');
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
        if (data.nomenclatureId) {
            const nomenclature = await this.prisma.nomenclature.findUnique({
                where: { id: data.nomenclatureId },
                select: { productTypeId: true },
            });
            if (nomenclature && nomenclature.productTypeId !== data.productTypeId) {
                this.logger.warn(`Nomenclature ${data.nomenclatureId} belongs to productType ${nomenclature.productTypeId}, ` +
                    `but workLog has productType ${data.productTypeId}. Ignoring nomenclatureId.`);
                data.nomenclatureId = undefined;
            }
        }
        const worker = await this.prisma.user.findUnique({
            where: { id: data.userId },
            select: { paymentType: true },
        });
        const isSalaryWorker = worker?.paymentType === 'SALARY';
        let pricePerUnit = 0;
        let totalAmount = 0;
        if (!isSalaryWorker) {
            const workRate = await this.findWorkRate(data.productTypeId, data.stage, data.nomenclatureId);
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
                const d = new Date(filters.startDate);
                if (!isNaN(d.getTime()))
                    where.completedAt.gte = d;
            }
            if (filters.endDate) {
                const d = new Date(filters.endDate);
                if (!isNaN(d.getTime()))
                    where.completedAt.lte = d;
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
    async getWorkerEarnings(userId, startDate, endDate) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        const now = new Date();
        const start = startDate
            ? new Date(startDate)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate
            ? new Date(endDate)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        const [workLogs, todayLogs, penalties, todayPenalties] = await Promise.all([
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
                orderBy: { completedAt: 'desc' },
            }),
            this.prisma.workLog.findMany({
                where: {
                    userId,
                    completedAt: { gte: todayStart, lte: todayEnd },
                },
                include: {
                    product: { select: { id: true, name: true } },
                    productType: { select: { id: true, name: true } },
                },
                orderBy: { completedAt: 'desc' },
            }),
            this.prisma.penalty.findMany({
                where: {
                    userId,
                    date: { gte: start, lte: end },
                    isCancelled: false,
                },
                orderBy: { date: 'desc' },
            }),
            this.prisma.penalty.findMany({
                where: {
                    userId,
                    date: { gte: todayStart, lte: todayEnd },
                    isCancelled: false,
                },
            }),
        ]);
        const periodTotal = workLogs.reduce((sum, log) => sum + log.totalAmount, 0);
        const todayTotal = todayLogs.reduce((sum, log) => sum + log.totalAmount, 0);
        const penaltyTotal = penalties.reduce((sum, p) => sum + p.amount, 0);
        const todayPenaltyTotal = todayPenalties.reduce((sum, p) => sum + p.amount, 0);
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
                workLogs: todayLogs.map(log => ({
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
            recentWorkLogs: workLogs.slice(0, 20).map(log => ({
                id: log.id,
                product: log.product?.name,
                productType: log.productType?.name,
                stage: log.stage,
                quantity: log.quantity,
                pricePerUnit: log.pricePerUnit,
                totalAmount: log.totalAmount,
                completedAt: log.completedAt,
            })),
            penalties: penalties.map(p => ({
                id: p.id,
                amount: p.amount,
                reason: p.reason,
                date: p.date,
            })),
        };
    }
    async getPayrollSummary(periodStart, periodEnd) {
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Неверный формат даты периода');
        }
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
        const commissions = await this.prisma.managerCommission.findMany({
            where: { isActive: true },
        });
        const usersWithCommissions = usersData.filter(u => {
            return commissions.some(c => c.userId === u.id || c.roleId === u.roleId);
        });
        const commissionUserIds = usersWithCommissions.map(u => u.id);
        let ordersByUser = new Map();
        let ordersWithMinByUser = new Map();
        if (commissionUserIds.length > 0) {
            const orderGroups = await this.prisma.order.groupBy({
                by: ['createdById'],
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
            const minAmounts = [...new Set(commissions.filter(c => c.minOrderAmount).map(c => c.minOrderAmount))];
            if (minAmounts.length > 0) {
                for (const minAmount of minAmounts) {
                    const relevantUserIds = commissionUserIds.filter(uid => {
                        const uc = commissions.find(c => c.userId === uid) ||
                            commissions.find(c => c.roleId === usersData.find(u => u.id === uid)?.roleId);
                        return uc?.minOrderAmount === minAmount;
                    });
                    if (relevantUserIds.length > 0) {
                        const filteredGroups = await this.prisma.order.groupBy({
                            by: ['createdById'],
                            _sum: { totalAmount: true },
                            where: {
                                createdById: { in: relevantUserIds },
                                createdAt: { gte: start, lte: end },
                                totalAmount: { gte: minAmount },
                            },
                        });
                        for (const group of filteredGroups) {
                            ordersWithMinByUser.set(group.createdById, group._sum.totalAmount || 0);
                        }
                    }
                }
            }
        }
        const users = usersData.map((user) => {
            const workData = workLogsByUser.find((w) => w.userId === user.id);
            const penaltyData = penaltiesByUser.find((p) => p.userId === user.id);
            const workAmount = workData?._sum.totalAmount || 0;
            const penaltyAmount = penaltyData?._sum.amount || 0;
            let commissionAmount = 0;
            let baseSalary = 0;
            const userCommission = commissions.find(c => c.userId === user.id)
                || commissions.find(c => c.roleId === user.roleId);
            if (userCommission) {
                baseSalary = userCommission.baseSalary || 0;
                const ordersAmount = userCommission.minOrderAmount
                    ? (ordersWithMinByUser.get(user.id) || 0)
                    : (ordersByUser.get(user.id) || 0);
                commissionAmount = ordersAmount * (userCommission.commissionPercent / 100);
            }
            const totalAmount = baseSalary + workAmount + commissionAmount - penaltyAmount;
            return {
                userId: user.id,
                userName: `${user.firstName} ${user.lastName}`,
                role: user.role?.name || 'Без роли',
                baseSalary,
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
    async getWorkerStats(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const productionRoleCodes = ['PREPARER', 'PAINTER', 'ASSEMBLER', 'SEWER'];
        const workers = await this.prisma.user.findMany({
            where: {
                isActive: true,
                role: { code: { in: productionRoleCodes } },
            },
            include: {
                role: true,
            },
        });
        const stats = await Promise.all(workers.map(async (worker) => {
            const workLogs = await this.prisma.workLog.findMany({
                where: {
                    userId: worker.id,
                    completedAt: { gte: start, lte: end },
                },
                select: {
                    quantity: true,
                    totalAmount: true,
                    pricePerUnit: true,
                    stage: true,
                    completedAt: true,
                },
            });
            const penalties = await this.prisma.penalty.aggregate({
                where: {
                    userId: worker.id,
                    date: { gte: start, lte: end },
                    isCancelled: false,
                },
                _sum: { amount: true },
                _count: true,
            });
            const itemsCompleted = workLogs.reduce((sum, wl) => sum + wl.quantity, 0);
            const workAmount = workLogs.reduce((sum, wl) => sum + wl.totalAmount, 0);
            const penaltyAmount = penalties._sum.amount || 0;
            const netAmount = workAmount - penaltyAmount;
            let efficiencyCoefficient = null;
            if (worker.paymentType === 'SALARY' && worker.monthlySalary && worker.monthlySalary > 0) {
                efficiencyCoefficient = Math.round((workAmount / worker.monthlySalary) * 100) / 100;
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
                penaltyCount: penalties._count,
                netAmount,
                efficiencyCoefficient,
                workLogsCount: workLogs.length,
            };
        }));
        return stats;
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = PayrollService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map