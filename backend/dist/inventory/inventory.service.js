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
    async getAllInventory() {
        return this.prisma.inventoryItem.findMany({
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
        const inventory = await this.prisma.inventoryItem.findMany({
            include: {
                productType: true,
            },
        });
        const summary = inventory.reduce((acc, item) => {
            const typeName = item.productType.name;
            if (!acc[typeName]) {
                acc[typeName] = {
                    productType: item.productType,
                    totalQuantity: 0,
                    items: [],
                };
            }
            acc[typeName].totalQuantity += item.quantity;
            acc[typeName].items.push(item);
            return acc;
        }, {});
        return Object.values(summary);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map