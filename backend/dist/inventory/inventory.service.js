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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createInventoryItem(data) {
        const productType = await this.prisma.productType.findUnique({
            where: { id: data.productTypeId },
        });
        if (!productType) {
            throw new common_1.NotFoundException('Тип товара не найден');
        }
        if (data.quantity <= 0) {
            throw new common_1.BadRequestException('Количество должно быть больше 0');
        }
        return this.prisma.inventoryItem.create({
            data: {
                name: data.name,
                quantity: data.quantity,
                productTypeId: data.productTypeId,
                notes: data.notes,
                receivedAt: new Date(),
            },
            include: {
                productType: true,
            },
        });
    }
    async getAllInventory(options) {
        const where = options?.productTypeId
            ? { productTypeId: options.productTypeId }
            : {};
        const items = await this.prisma.inventoryItem.findMany({
            where,
            select: {
                id: true,
                name: true,
                quantity: true,
                notes: true,
                receivedAt: true,
                createdAt: true,
                productType: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        stage: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        customerName: true,
                    },
                },
            },
            orderBy: {
                receivedAt: 'desc',
            },
        });
        return items;
    }
    async getInventoryByType(productTypeId) {
        return this.prisma.inventoryItem.findMany({
            where: {
                productTypeId,
            },
            include: {
                product: true,
                productType: true,
                order: true,
            },
            orderBy: {
                receivedAt: 'desc',
            },
        });
    }
    async getInventoryByOrder(orderId) {
        return this.prisma.inventoryItem.findMany({
            where: {
                orderId,
            },
            include: {
                product: true,
                productType: true,
                order: true,
            },
            orderBy: {
                receivedAt: 'desc',
            },
        });
    }
    async getInventoryItem(id) {
        return this.prisma.inventoryItem.findUnique({
            where: { id },
            include: {
                product: true,
                productType: true,
                order: true,
                shipmentItems: {
                    include: {
                        shipment: {
                            include: {
                                shippedBy: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
    }
    async getInventorySummary() {
        const aggregated = await this.prisma.inventoryItem.groupBy({
            by: ['productTypeId'],
            _sum: {
                quantity: true,
            },
            _count: {
                id: true,
            },
        });
        const productTypeIds = aggregated.map(a => a.productTypeId);
        const productTypes = await this.prisma.productType.findMany({
            where: {
                id: { in: productTypeIds },
            },
            select: {
                id: true,
                name: true,
            },
        });
        const productTypeMap = new Map(productTypes.map(pt => [pt.id, pt]));
        return aggregated.map(a => ({
            productType: productTypeMap.get(a.productTypeId),
            totalQuantity: a._sum.quantity || 0,
            itemCount: a._count.id,
        }));
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map