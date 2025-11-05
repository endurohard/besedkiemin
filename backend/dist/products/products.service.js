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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const client_1 = require("@prisma/client");
let ProductsService = class ProductsService {
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
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
        });
        if (!firstWorkflowStage) {
            throw new common_1.NotFoundException('Не найдены активные стадии workflow');
        }
        const product = await this.prisma.product.create({
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
            },
            include: {
                order: true,
                productType: true,
            },
        });
        const secondWorkflowStage = await this.prisma.workflowStage.findFirst({
            where: {
                isActive: true,
                order: { gt: firstWorkflowStage.order }
            },
            orderBy: { order: 'asc' },
        });
        if (secondWorkflowStage) {
            await this.prisma.product.update({
                where: { id: product.id },
                data: { stage: secondWorkflowStage.legacyStage },
            });
            await this.prisma.productHistory.create({
                data: {
                    productId: product.id,
                    userId: order.createdById,
                    stage: firstWorkflowStage.legacyStage,
                    status: 'PASSED',
                    startedAt: new Date(),
                    completedAt: new Date(),
                    passedAt: new Date(),
                },
            });
            const nextWorkers = await this.prisma.user.findMany({
                where: {
                    role: secondWorkflowStage.role,
                    isActive: true,
                },
            });
            for (const worker of nextWorkers) {
                const newTask = await this.prisma.task.create({
                    data: {
                        title: `${product.name} - ${secondWorkflowStage.name}`,
                        description: `Новый продукт. Заказ: ${order.orderNumber}`,
                        stage: secondWorkflowStage.legacyStage,
                        productId: product.id,
                        assignedToId: worker.id,
                        quantity: product.quantity,
                    },
                });
                if (worker.telegramId) {
                    const message = `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
                        `*Продукт:* ${product.name}\n` +
                        `*Тип:* ${product.productType?.name || 'Н/Д'}\n` +
                        `*Количество:* ${product.quantity} шт.\n` +
                        `*Стадия:* ${secondWorkflowStage.name}\n` +
                        `*Заказ:* ${order.orderNumber}\n` +
                        `*Клиент:* ${order.customerName || 'Н/Д'}\n\n` +
                        `✅ Откройте раздел "Мои задачи" для выполнения`;
                    try {
                        await this.telegramService.sendMessage(worker.telegramId, message);
                        console.log(`📲 Уведомление отправлено работнику ${worker.email} (${worker.role})`);
                    }
                    catch (error) {
                        console.error(`❌ Ошибка отправки уведомления работнику ${worker.email}:`, error);
                    }
                }
            }
            await this.updateOrderStatus(order.id);
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
        return this.prisma.product.findMany({
            where,
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        customerName: true,
                        status: true,
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
            orderBy: {
                createdAt: 'desc',
            },
        });
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
        this.validateStageTransition(product.stage, newStage);
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
    validateStageTransition(currentStage, newStage) {
        const validTransitions = {
            [client_1.ProductionStage.PENDING]: [client_1.ProductionStage.DESIGN],
            [client_1.ProductionStage.DESIGN]: [client_1.ProductionStage.PREPARATION, client_1.ProductionStage.PENDING],
            [client_1.ProductionStage.PREPARATION]: [client_1.ProductionStage.PAINTING, client_1.ProductionStage.DESIGN],
            [client_1.ProductionStage.PAINTING]: [client_1.ProductionStage.QUALITY_CHECK, client_1.ProductionStage.PREPARATION],
            [client_1.ProductionStage.QUALITY_CHECK]: [
                client_1.ProductionStage.COMPLETED,
                client_1.ProductionStage.REJECTED,
                client_1.ProductionStage.PAINTING,
            ],
            [client_1.ProductionStage.COMPLETED]: [],
            [client_1.ProductionStage.REJECTED]: [client_1.ProductionStage.PAINTING],
        };
        const allowedTransitions = validTransitions[currentStage] || [];
        if (!allowedTransitions.includes(newStage)) {
            throw new common_1.BadRequestException(`Невозможен переход с этапа ${currentStage} на ${newStage}`);
        }
    }
    async updateOrderStatus(orderId) {
        const products = await this.prisma.product.findMany({
            where: { orderId },
        });
        const allCompleted = products.every((p) => p.stage === client_1.ProductionStage.COMPLETED);
        const hasStarted = products.some((p) => p.stage !== client_1.ProductionStage.PENDING);
        let newStatus = null;
        if (allCompleted && products.length > 0) {
            newStatus = client_1.OrderStatus.COMPLETED;
        }
        else if (hasStarted) {
            newStatus = client_1.OrderStatus.IN_PRODUCTION;
        }
        if (newStatus) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: newStatus },
            });
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], ProductsService);
//# sourceMappingURL=products.service.js.map