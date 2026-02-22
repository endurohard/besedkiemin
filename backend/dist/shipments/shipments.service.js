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
exports.ShipmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ShipmentsService = class ShipmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createShipment(userId, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user || (user.role?.code !== 'WAREHOUSE' && user.role?.code !== 'OWNER' && user.role?.code !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Только складист, менеджер и владелец могут создавать отгрузки');
        }
        if (!data.items || data.items.length === 0) {
            throw new common_1.BadRequestException('Необходимо указать хотя бы один товар для отгрузки');
        }
        const inventoryItemIds = data.items.map(item => item.inventoryItemId);
        const inventoryItems = await this.prisma.inventoryItem.findMany({
            where: { id: { in: inventoryItemIds } },
            include: {
                product: true,
                productType: true,
            },
        });
        if (inventoryItems.length !== data.items.length) {
            throw new common_1.NotFoundException('Один или несколько товаров не найдены на складе');
        }
        for (const itemData of data.items) {
            const inventoryItem = inventoryItems.find(i => i.id === itemData.inventoryItemId);
            if (!inventoryItem) {
                throw new common_1.NotFoundException(`Товар с ID ${itemData.inventoryItemId} не найден`);
            }
            if (inventoryItem.quantity < itemData.quantity) {
                throw new common_1.BadRequestException(`Недостаточно товара "${inventoryItem.name}". Доступно: ${inventoryItem.quantity}, запрошено: ${itemData.quantity}`);
            }
        }
        const shipment = await this.prisma.$transaction(async (tx) => {
            const newShipment = await tx.shipment.create({
                data: {
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    deliveryAddress: data.deliveryAddress,
                    deliveryDate: data.deliveryDate,
                    notes: data.notes,
                    orderNumber: data.orderNumber,
                    shippedById: userId,
                    items: {
                        create: data.items.map(item => ({
                            inventoryItemId: item.inventoryItemId,
                            quantity: item.quantity,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            inventoryItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    quantity: true,
                                    productType: {
                                        select: { id: true, name: true },
                                    },
                                },
                            },
                        },
                    },
                    shippedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });
            await Promise.all(data.items.map(async (itemData) => {
                const inventoryItem = inventoryItems.find(i => i.id === itemData.inventoryItemId);
                return tx.inventoryItem.update({
                    where: { id: itemData.inventoryItemId },
                    data: {
                        quantity: inventoryItem.quantity - itemData.quantity,
                    },
                });
            }));
            return newShipment;
        });
        return shipment;
    }
    async getAllShipments(userId, options) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user) {
            throw new common_1.ForbiddenException('Пользователь не найден');
        }
        const where = options?.status ? { status: options.status } : {};
        const shipments = await this.prisma.shipment.findMany({
            where,
            select: {
                id: true,
                status: true,
                customerName: true,
                customerPhone: true,
                deliveryAddress: true,
                deliveryDate: true,
                orderNumber: true,
                notes: true,
                createdAt: true,
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        inventoryItem: {
                            select: {
                                id: true,
                                name: true,
                                productType: {
                                    select: { id: true, name: true },
                                },
                            },
                        },
                    },
                },
                shippedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return shipments;
    }
    async getShipmentsByStatus(userId, status) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.ForbiddenException('Пользователь не найден');
        }
        return this.prisma.shipment.findMany({
            where: { status },
            include: {
                items: {
                    include: {
                        inventoryItem: {
                            include: {
                                product: true,
                                productType: true,
                                order: true,
                            },
                        },
                    },
                },
                shippedBy: {
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
        });
    }
    async getShipment(id) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        inventoryItem: {
                            include: {
                                product: true,
                                productType: true,
                                order: true,
                            },
                        },
                    },
                },
                shippedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        if (!shipment) {
            throw new common_1.NotFoundException('Отгрузка не найдена');
        }
        return shipment;
    }
    async updateShipmentStatus(id, userId, status) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user || (user.role?.code !== 'WAREHOUSE' && user.role?.code !== 'OWNER' && user.role?.code !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Только складист, менеджер и владелец могут обновлять статус отгрузки');
        }
        const shipment = await this.prisma.shipment.findUnique({
            where: { id },
        });
        if (!shipment) {
            throw new common_1.NotFoundException('Отгрузка не найдена');
        }
        return this.prisma.shipment.update({
            where: { id },
            data: { status },
            include: {
                items: {
                    include: {
                        inventoryItem: {
                            include: {
                                product: true,
                                productType: true,
                                order: true,
                            },
                        },
                    },
                },
                shippedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
    async cancelShipment(id, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user || (user.role?.code !== 'WAREHOUSE' && user.role?.code !== 'OWNER' && user.role?.code !== 'MANAGER')) {
            throw new common_1.ForbiddenException('Только складист, менеджер и владелец могут отменять отгрузки');
        }
        const shipment = await this.prisma.shipment.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        inventoryItem: true,
                    },
                },
            },
        });
        if (!shipment) {
            throw new common_1.NotFoundException('Отгрузка не найдена');
        }
        if (shipment.status === client_1.ShipmentStatus.DELIVERED) {
            throw new common_1.BadRequestException('Нельзя отменить доставленную отгрузку');
        }
        const updatedShipment = await this.prisma.$transaction(async (tx) => {
            const cancelled = await tx.shipment.update({
                where: { id },
                data: { status: client_1.ShipmentStatus.CANCELLED },
            });
            for (const item of shipment.items) {
                const inventoryItem = await tx.inventoryItem.findUnique({
                    where: { id: item.inventoryItemId },
                });
                if (!inventoryItem) {
                    throw new common_1.NotFoundException(`Позиция склада ${item.inventoryItemId} не найдена. Отмена отгрузки прервана.`);
                }
                await tx.inventoryItem.update({
                    where: { id: item.inventoryItemId },
                    data: {
                        quantity: inventoryItem.quantity + item.quantity,
                    },
                });
            }
            return cancelled;
        });
        return updatedShipment;
    }
    async getWaybillData(id) {
        const shipment = await this.prisma.shipment.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        inventoryItem: {
                            include: {
                                product: true,
                                productType: true,
                                order: true,
                            },
                        },
                    },
                },
                shippedBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!shipment) {
            throw new common_1.NotFoundException('Отгрузка не найдена');
        }
        return {
            shipmentId: shipment.id,
            shipmentDate: shipment.createdAt.toISOString(),
            customerName: shipment.customerName,
            customerPhone: shipment.customerPhone,
            deliveryAddress: shipment.deliveryAddress,
            deliveryDate: shipment.deliveryDate?.toISOString(),
            orderNumber: shipment.orderNumber || shipment.items[0]?.inventoryItem?.order?.orderNumber || '—',
            items: shipment.items.map(item => ({
                name: item.inventoryItem.name,
                quantity: item.quantity,
                productType: item.inventoryItem.productType.name,
                orderNumber: item.inventoryItem.order?.orderNumber,
            })),
            shippedBy: `${shipment.shippedBy.firstName} ${shipment.shippedBy.lastName}`,
            notes: shipment.notes,
        };
    }
};
exports.ShipmentsService = ShipmentsService;
exports.ShipmentsService = ShipmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShipmentsService);
//# sourceMappingURL=shipments.service.js.map