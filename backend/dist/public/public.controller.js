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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PublicController = class PublicController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrderStatus(orderNumber) {
        if (!orderNumber) {
            throw new common_1.NotFoundException('Номер заказа не указан');
        }
        const order = await this.prisma.order.findFirst({
            where: { orderNumber },
            include: {
                products: {
                    include: {
                        productType: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Заказ не найден');
        }
        let statusText = '';
        let statusEmoji = '';
        let detailedStatus = '';
        if (order.status === 'NEW') {
            statusText = 'Новый заказ';
            statusEmoji = '📝';
            detailedStatus = 'Ваш заказ принят и ожидает начала производства';
        }
        else if (order.status === 'IN_PRODUCTION') {
            statusText = 'В производстве';
            statusEmoji = '⚙️';
            const totalProducts = order.products.length;
            const completedProducts = order.products.filter(p => p.stage === 'COMPLETED' || p.stage === 'QUALITY_CHECK').length;
            detailedStatus = `Изготовление: ${completedProducts} из ${totalProducts} изделий готово`;
        }
        else if (order.status === 'COMPLETED') {
            const shipment = await this.prisma.shipment.findFirst({
                where: {
                    items: {
                        some: {
                            inventoryItem: {
                                orderId: order.id,
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            if (shipment) {
                if (shipment.status === 'PENDING') {
                    statusText = 'Готов к отгрузке';
                    statusEmoji = '📦';
                    detailedStatus = 'Заказ готов и ожидает отправки';
                }
                else if (shipment.status === 'IN_TRANSIT') {
                    statusText = 'В пути';
                    statusEmoji = '🚚';
                    detailedStatus = shipment.deliveryDate
                        ? `Заказ в пути, ожидаемая дата доставки: ${new Date(shipment.deliveryDate).toLocaleDateString('ru-RU')}`
                        : 'Заказ в пути к вам';
                }
                else if (shipment.status === 'DELIVERED') {
                    statusText = 'Доставлен';
                    statusEmoji = '✅';
                    detailedStatus = 'Заказ успешно доставлен';
                }
            }
            else {
                statusText = 'Готов';
                statusEmoji = '✅';
                detailedStatus = 'Заказ изготовлен и находится на складе';
            }
        }
        else if (order.status === 'CANCELLED') {
            statusText = 'Отменен';
            statusEmoji = '❌';
            detailedStatus = 'Заказ отменен';
        }
        return {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            status: order.status,
            statusText,
            statusEmoji,
            detailedStatus,
            createdAt: order.createdAt,
            products: order.products.map(p => ({
                name: p.name,
                typeName: p.productType.name,
                quantity: p.quantity,
                stage: p.stage,
            })),
        };
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)('order-status'),
    __param(0, (0, common_1.Query)('orderNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getOrderStatus", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicController);
//# sourceMappingURL=public.controller.js.map