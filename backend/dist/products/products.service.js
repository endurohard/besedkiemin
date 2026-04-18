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
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const client_1 = require("@prisma/client");
let ProductsService = ProductsService_1 = class ProductsService {
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.logger = new common_1.Logger(ProductsService_1.name);
    }
    async create(createProductDto) {
        const order = await this.prisma.order.findUnique({
            where: { id: createProductDto.orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Заказ не найден');
        }
        const firstWorkflowStage = await this.prisma.workflowStage.findFirst({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
                roles: { include: { role: true } },
            },
        });
        if (!firstWorkflowStage) {
            throw new common_1.NotFoundException('Не найдены активные стадии workflow');
        }
        const roleIds = firstWorkflowStage.roles.map(r => r.roleId) || [];
        const workers = roleIds.length > 0
            ? await this.prisma.user.findMany({
                where: {
                    roleId: { in: roleIds },
                    isActive: true,
                },
                include: { role: true },
            })
            : [];
        const assignments = createProductDto.stageAssignments || {};
        const firstStageKey = firstWorkflowStage.legacyStage;
        const assignedWorkerId = createProductDto.assignedWorkerId
            || (firstStageKey ? assignments[firstStageKey] : undefined);
        const taskWorkers = assignedWorkerId
            ? workers.filter(w => w.id === assignedWorkerId)
            : workers;
        const product = await this.prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: {
                    name: createProductDto.name,
                    productTypeId: createProductDto.productTypeId,
                    description: createProductDto.description,
                    quantity: createProductDto.quantity,
                    dimensions: createProductDto.dimensions,
                    schemaImageUrl: createProductDto.schemaImageUrl,
                    orderId: createProductDto.orderId,
                    deadline: createProductDto.deadline,
                    stage: firstWorkflowStage.legacyStage,
                    color: createProductDto.color,
                    upholsteryMaterial: createProductDto.upholsteryMaterial,
                    requiresSewing: createProductDto.requiresSewing,
                    nomenclatureId: createProductDto.nomenclatureId,
                    stageAssignments: createProductDto.stageAssignments || undefined,
                },
                include: {
                    order: true,
                    productType: true,
                },
            });
            if (taskWorkers.length > 0) {
                await Promise.all(taskWorkers.map((worker) => tx.task.create({
                    data: {
                        title: `${newProduct.name} - ${firstWorkflowStage.name}`,
                        description: `Новый продукт. Заказ: ${order.orderNumber}`,
                        stage: firstWorkflowStage.legacyStage,
                        productId: newProduct.id,
                        assignedToId: worker.id,
                        quantity: newProduct.quantity,
                        workflowStageId: firstWorkflowStage.id,
                    },
                })));
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: client_1.OrderStatus.IN_PRODUCTION },
                });
            }
            return newProduct;
        });
        if (taskWorkers.length > 0) {
            Promise.allSettled(taskWorkers
                .filter((worker) => worker.telegramId)
                .map(async (worker) => {
                const message = `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
                    `*Продукт:* ${product.name}\n` +
                    `*Тип:* ${product.productType?.name || 'Н/Д'}\n` +
                    `*Количество:* ${product.quantity} шт.\n` +
                    `*Стадия:* ${firstWorkflowStage.name}\n` +
                    `*Заказ:* ${order.orderNumber}\n\n` +
                    `✅ Откройте раздел "Мои задачи" для выполнения`;
                try {
                    await this.telegramService.sendMessage(worker.telegramId, message);
                    this.logger.log(`Уведомление отправлено работнику ${worker.email}`);
                }
                catch (error) {
                    this.logger.error(`Ошибка отправки уведомления работнику ${worker.email}:`, error);
                }
            }));
        }
        return product;
    }
    async findAll(filters) {
        const where = {};
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
                            startedAt: 'desc',
                        },
                        take: 5,
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
                            createdAt: 'desc',
                        },
                        take: 3,
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.product.count({ where }),
        ]);
        return products;
    }
    async findOne(id) {
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
                        startedAt: 'asc',
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
                        createdAt: 'desc',
                    },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Продукт не найден');
        }
        return product;
    }
    async update(id, updateProductDto) {
        await this.findOne(id);
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
    async remove(id) {
        await this.findOne(id);
        return this.prisma.product.delete({
            where: { id },
        });
    }
    async moveToStage(productId, newStage, userId, notes) {
        const product = await this.findOne(productId);
        await this.validateStageTransition(product.stage, newStage);
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
        await this.prisma.productHistory.create({
            data: {
                productId,
                stage: newStage,
                userId,
                notes,
                startedAt: new Date(),
            },
        });
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
                        startedAt: 'desc',
                    },
                },
            },
        });
        await this.updateOrderStatus(product.orderId);
        return updatedProduct;
    }
    async getProductsByStage(stage) {
        return this.findAll({ stage });
    }
    async getProductHistory(productId) {
        await this.findOne(productId);
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
                startedAt: 'asc',
            },
        });
    }
    async validateStageTransition(currentStage, newStage) {
        if (currentStage === client_1.ProductionStage.COMPLETED) {
            throw new common_1.BadRequestException(`Невозможен переход с этапа ${currentStage} на ${newStage}`);
        }
        if (currentStage === client_1.ProductionStage.REJECTED) {
            const activeStages = await this.prisma.workflowStage.findMany({
                where: { isActive: true },
                select: { legacyStage: true },
            });
            const activeStageValues = activeStages.map(s => s.legacyStage);
            if (!activeStageValues.includes(newStage)) {
                throw new common_1.BadRequestException(`Невозможен переход с этапа ${currentStage} на ${newStage}`);
            }
            return;
        }
        const workflowStages = await this.prisma.workflowStage.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        const currentIndex = workflowStages.findIndex(s => s.legacyStage === currentStage);
        const newIndex = workflowStages.findIndex(s => s.legacyStage === newStage);
        const lastStage = workflowStages[workflowStages.length - 1];
        if (lastStage && currentStage === lastStage.legacyStage) {
            if (newStage === client_1.ProductionStage.COMPLETED || newStage === client_1.ProductionStage.REJECTED) {
                return;
            }
            if (newIndex >= 0) {
                return;
            }
        }
        if (currentIndex >= 0 && newIndex >= 0) {
            if (newIndex === currentIndex + 1 || newIndex === currentIndex + 2) {
                return;
            }
            if (newIndex < currentIndex) {
                return;
            }
        }
        if (currentStage === client_1.ProductionStage.PENDING && newIndex === 0) {
            return;
        }
        throw new common_1.BadRequestException(`Невозможен переход с этапа ${currentStage} на ${newStage}`);
    }
    async updateOrderStatus(orderId) {
        const products = await this.prisma.product.findMany({
            where: { orderId },
        });
        if (products.length === 0)
            return;
        const allCompleted = products.every((p) => p.stage === client_1.ProductionStage.COMPLETED);
        const allPending = products.every((p) => p.stage === client_1.ProductionStage.PENDING);
        const hasStarted = products.some((p) => p.stage !== client_1.ProductionStage.PENDING);
        let newStatus;
        if (allCompleted) {
            newStatus = client_1.OrderStatus.COMPLETED;
        }
        else if (allPending) {
            newStatus = client_1.OrderStatus.NEW;
        }
        else if (hasStarted) {
            newStatus = client_1.OrderStatus.IN_PRODUCTION;
        }
        else {
            return;
        }
        await this.prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], ProductsService);
//# sourceMappingURL=products.service.js.map