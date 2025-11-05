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
exports.CatalogOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
let CatalogOrdersService = class CatalogOrdersService {
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
    }
    async create(createDto) {
        const productIds = createDto.items.map((item) => item.productId);
        const products = await this.prisma.catalogProduct.findMany({
            where: {
                id: { in: productIds },
                isActive: true,
            },
        });
        if (products.length !== productIds.length) {
            throw new common_1.BadRequestException('Некоторые товары не найдены или неактивны');
        }
        const orderCount = await this.prisma.catalogOrder.count();
        const orderNumber = `WEB-${String(orderCount + 1).padStart(6, '0')}`;
        let totalAmount = 0;
        const itemsData = createDto.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const price = product?.price || 0;
            const quantity = item.quantity || 1;
            totalAmount += price * quantity;
            return {
                productId: item.productId,
                quantity,
                price,
                comment: item.comment,
            };
        });
        return this.prisma.catalogOrder.create({
            data: {
                orderNumber,
                customerName: createDto.customerName,
                customerPhone: createDto.customerPhone,
                customerEmail: createDto.customerEmail,
                comment: createDto.comment,
                deliveryAddress: createDto.deliveryAddress,
                totalAmount: totalAmount > 0 ? totalAmount : null,
                items: {
                    create: itemsData,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }
    async findAll(status) {
        const where = status ? { status: status } : {};
        return this.prisma.catalogOrder.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }
    async findOne(id) {
        const order = await this.prisma.catalogOrder.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Заказ с ID ${id} не найден`);
        }
        return order;
    }
    async update(id, updateDto) {
        await this.findOne(id);
        return this.prisma.catalogOrder.update({
            where: { id },
            data: updateDto,
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.catalogOrder.delete({
            where: { id },
        });
    }
    async markContacted(id, userId) {
        await this.findOne(id);
        return this.prisma.catalogOrder.update({
            where: { id },
            data: {
                contactedAt: new Date(),
                contactedBy: userId,
                status: 'CONTACTED',
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }
    async markProcessed(id, userId) {
        const catalogOrder = await this.findOne(id);
        const productionOrderNumber = catalogOrder.orderNumber.replace('WEB-', 'ORD-');
        const existingProductionOrder = await this.prisma.order.findFirst({
            where: { orderNumber: productionOrderNumber },
        });
        if (existingProductionOrder) {
            throw new common_1.BadRequestException('Производственный заказ уже был создан для этого заказа с сайта');
        }
        const productionOrder = await this.prisma.order.create({
            data: {
                orderNumber: productionOrderNumber,
                customerName: catalogOrder.customerName,
                customerPhone: catalogOrder.customerPhone,
                customerAddress: catalogOrder.deliveryAddress || '',
                status: 'NEW',
                createdById: userId,
            },
        });
        const defaultProductType = await this.prisma.productType.findFirst({
            where: { isActive: true },
        });
        if (!defaultProductType) {
            throw new common_1.BadRequestException('Не найдено активных типов продукции');
        }
        const firstStage = await this.prisma.workflowStage.findFirst({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        if (!firstStage) {
            throw new common_1.BadRequestException('Не найдено активных стадий производства');
        }
        const workers = await this.prisma.user.findMany({
            where: {
                role: firstStage.role,
                isActive: true,
            },
        });
        for (const item of catalogOrder.items) {
            const product = await this.prisma.product.create({
                data: {
                    name: item.product.name,
                    orderId: productionOrder.id,
                    quantity: item.quantity,
                    productTypeId: defaultProductType.id,
                    stage: firstStage.legacyStage,
                },
                include: {
                    productType: true,
                    order: true,
                },
            });
            for (const worker of workers) {
                const newTask = await this.prisma.task.create({
                    data: {
                        title: `${product.name} - ${firstStage.name}`,
                        description: `Новый продукт для обработки. Заказ: ${productionOrder.orderNumber}`,
                        stage: firstStage.legacyStage,
                        productId: product.id,
                        assignedToId: worker.id,
                    },
                });
                if (worker.telegramId) {
                    const message = `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
                        `*Продукт:* ${product.name}\n` +
                        `*Тип:* ${product.productType?.name || 'Н/Д'}\n` +
                        `*Количество:* ${product.quantity} шт.\n` +
                        `*Стадия:* ${firstStage.name}\n` +
                        `*Заказ:* ${productionOrder.orderNumber}\n` +
                        `*Клиент:* ${productionOrder.customerName || 'Н/Д'}\n` +
                        `*Источник:* Заказ с сайта\n\n` +
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
        }
        return this.prisma.catalogOrder.update({
            where: { id },
            data: {
                processedAt: new Date(),
                processedBy: userId,
                status: 'IN_WORK',
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }
    async cancelOrder(id, cancellationReason, userId) {
        await this.findOne(id);
        return this.prisma.catalogOrder.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancellationReason,
                processedAt: new Date(),
                processedBy: userId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }
};
exports.CatalogOrdersService = CatalogOrdersService;
exports.CatalogOrdersService = CatalogOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], CatalogOrdersService);
//# sourceMappingURL=catalog-orders.service.js.map