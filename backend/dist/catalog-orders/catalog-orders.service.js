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
var CatalogOrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const constants_1 = require("../common/constants");
let CatalogOrdersService = CatalogOrdersService_1 = class CatalogOrdersService {
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.logger = new common_1.Logger(CatalogOrdersService_1.name);
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
        const order = await this.prisma.catalogOrder.create({
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
        try {
            let message = `🛒 <b>Новый заказ с сайта!</b>\n\n`;
            message += `📋 Номер: <b>${orderNumber}</b>\n`;
            message += `👤 Клиент: ${createDto.customerName}\n`;
            message += `📞 Телефон: ${createDto.customerPhone}\n`;
            if (createDto.customerEmail) {
                message += `📧 Email: ${createDto.customerEmail}\n`;
            }
            if (createDto.comment) {
                message += `💬 Комментарий: ${createDto.comment}\n`;
            }
            if (createDto.deliveryAddress) {
                message += `📍 Адрес: ${createDto.deliveryAddress}\n`;
            }
            if (order.items.length > 0) {
                message += `\n📦 <b>Товары:</b>\n`;
                order.items.forEach((item) => {
                    message += `   • ${item.product.name} x ${item.quantity} = ${(item.price * item.quantity).toLocaleString('ru-RU')} ₽\n`;
                });
                message += `\n💰 <b>Итого: ${totalAmount.toLocaleString('ru-RU')} ₽</b>`;
            }
            else {
                message += `\n<i>Товары не указаны (быстрая заявка)</i>`;
            }
            await this.telegramService.notifyAdmins(message);
        }
        catch (error) {
            this.logger.error('Ошибка отправки уведомления в Telegram:', error);
        }
        return order;
    }
    async findAll(filters) {
        const where = filters?.status ? { status: filters.status } : {};
        const page = Math.max(1, filters?.page || constants_1.PAGINATION.DEFAULT_PAGE);
        const limit = Math.min(constants_1.PAGINATION.MAX_PAGE_SIZE, Math.max(1, filters?.limit || constants_1.PAGINATION.DEFAULT_PAGE_SIZE));
        const [orders, total] = await Promise.all([
            this.prisma.catalogOrder.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            }),
            this.prisma.catalogOrder.count({ where }),
        ]);
        return {
            data: orders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
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
        if (catalogOrder.status === 'IN_WORK') {
            return catalogOrder;
        }
        const productionOrderNumber = catalogOrder.orderNumber.replace('WEB-', 'ORD-');
        const existingProductionOrder = await this.prisma.order.findFirst({
            where: { orderNumber: productionOrderNumber },
        });
        if (existingProductionOrder) {
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
        const [defaultProductType, firstStage] = await Promise.all([
            this.prisma.productType.findFirst({
                where: { isActive: true },
                select: { id: true, name: true },
            }),
            this.prisma.workflowStage.findFirst({
                where: { isActive: true },
                orderBy: { order: 'asc' },
                include: { roles: { include: { role: true } } },
            }),
        ]);
        if (!defaultProductType) {
            throw new common_1.BadRequestException('Не найдено активных типов продукции');
        }
        if (!firstStage) {
            throw new common_1.BadRequestException('Не найдено активных стадий производства');
        }
        const firstStageRoleIds = firstStage.roles.map(r => r.roleId);
        const workers = await this.prisma.user.findMany({
            where: {
                roleId: { in: firstStageRoleIds },
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                role: { select: { code: true, name: true } },
                telegramId: true,
            },
        });
        const itemsToProcess = catalogOrder.items.length > 0
            ? catalogOrder.items
            : [{
                    product: { name: 'Заказ с сайта (уточнить состав)' },
                    quantity: 1,
                    price: 0
                }];
        const result = await this.prisma.$transaction(async (tx) => {
            const lockedOrder = await tx.catalogOrder.findUnique({
                where: { id },
                select: { status: true },
            });
            if (lockedOrder?.status === 'IN_WORK') {
                throw new common_1.BadRequestException('Заказ уже обрабатывается');
            }
            const productionOrder = await tx.order.create({
                data: {
                    orderNumber: productionOrderNumber,
                    customerName: catalogOrder.customerName,
                    customerPhone: catalogOrder.customerPhone,
                    customerAddress: catalogOrder.deliveryAddress || '',
                    status: 'NEW',
                    createdById: userId,
                },
            });
            const products = await Promise.all(itemsToProcess.map((item) => tx.product.create({
                data: {
                    name: item.product.name,
                    orderId: productionOrder.id,
                    quantity: item.quantity,
                    productTypeId: defaultProductType.id,
                    stage: firstStage.legacyStage,
                },
            })));
            const taskPromises = products.flatMap((product) => workers.map((worker) => tx.task.create({
                data: {
                    title: `${product.name} - ${firstStage.name}`,
                    description: `Новый продукт для обработки. Заказ: ${productionOrder.orderNumber}`,
                    stage: firstStage.legacyStage,
                    productId: product.id,
                    assignedToId: worker.id,
                },
            })));
            await Promise.all(taskPromises);
            const updatedOrder = await tx.catalogOrder.update({
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
            return { updatedOrder, products, productionOrder };
        });
        Promise.allSettled(result.products.flatMap((product) => workers
            .filter((worker) => worker.telegramId)
            .map(async (worker) => {
            const message = `🆕 *НОВАЯ ЗАДАЧА*\n\n` +
                `*Продукт:* ${product.name}\n` +
                `*Тип:* ${defaultProductType.name || 'Н/Д'}\n` +
                `*Количество:* ${product.quantity} шт.\n` +
                `*Стадия:* ${firstStage.name}\n` +
                `*Заказ:* ${result.productionOrder.orderNumber}\n` +
                `*Источник:* Заказ с сайта\n\n` +
                `✅ Откройте раздел "Мои задачи" для выполнения`;
            try {
                await this.telegramService.sendMessage(worker.telegramId, message);
                this.logger.log(`Уведомление отправлено работнику ${worker.email}`);
            }
            catch (error) {
                this.logger.error(`Ошибка отправки уведомления работнику ${worker.email}:`, error);
            }
        })));
        return result.updatedOrder;
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
exports.CatalogOrdersService = CatalogOrdersService = CatalogOrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], CatalogOrdersService);
//# sourceMappingURL=catalog-orders.service.js.map