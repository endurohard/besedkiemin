"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const ExcelJS = __importStar(require("exceljs"));
const constants_1 = require("../common/constants");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
let OrdersService = class OrdersService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async create(createOrderDto, userId) {
        let orderNumber = createOrderDto.orderNumber?.trim();
        if (!orderNumber) {
            const result = await this.prisma.$queryRawUnsafe(`SELECT COALESCE(
          MAX(CAST(SUBSTRING(order_number FROM $1) AS INTEGER)), 0
        ) + 1 AS next_num
        FROM orders
        WHERE order_number ~ $2`, "ORD-(\\d+)", "^ORD-\\d+$");
            const nextNum = Number(result[0]?.next_num || 1);
            orderNumber = `ORD-${String(nextNum).padStart(3, "0")}`;
        }
        const { orderNumber: _, ...restDto } = createOrderDto;
        return this.prisma.order.create({
            data: {
                ...restDto,
                orderNumber,
                status: client_1.OrderStatus.NEW,
                createdById: userId,
            },
            include: {
                products: {
                    include: {
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
                },
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                source: true,
            },
        });
    }
    async findAll(filters) {
        const where = {};
        const page = Math.max(1, filters?.page || constants_1.PAGINATION.DEFAULT_PAGE);
        const limit = Math.min(constants_1.PAGINATION.MAX_PAGE_SIZE, Math.max(1, filters?.limit || constants_1.PAGINATION.DEFAULT_PAGE_SIZE));
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                const d = new Date(filters.startDate);
                if (!isNaN(d.getTime()))
                    where.createdAt.gte = d;
            }
            if (filters.endDate) {
                const d = new Date(filters.endDate);
                if (!isNaN(d.getTime()))
                    where.createdAt.lte = d;
            }
        }
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                    customerPhone: true,
                    customerAddress: true,
                    status: true,
                    priority: true,
                    description: true,
                    totalAmount: true,
                    sourceId: true,
                    source: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            color: true,
                            icon: true,
                        },
                    },
                    createdAt: true,
                    updatedAt: true,
                    products: {
                        select: {
                            id: true,
                            name: true,
                            stage: true,
                            quantity: true,
                            productType: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.order.count({ where }),
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
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                products: {
                    include: {
                        productType: { select: { id: true, name: true } },
                        nomenclature: { select: { id: true, name: true, color: true } },
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
                                workflowStage: { select: { id: true, name: true, order: true } },
                            },
                            orderBy: {
                                startedAt: "asc",
                            },
                        },
                        tasks: {
                            where: { status: { in: ["NEW", "ACCEPTED", "COMPLETED"] } },
                            include: {
                                assignedTo: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        role: { select: { code: true, name: true } },
                                    },
                                },
                            },
                            orderBy: { createdAt: "asc" },
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
                                createdAt: "desc",
                            },
                        },
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                source: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Заказ с ID ${id} не найден`);
        }
        return order;
    }
    async update(id, updateOrderDto) {
        await this.findOne(id);
        return this.prisma.order.update({
            where: { id },
            data: updateOrderDto,
            include: {
                products: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                source: true,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.order.delete({
            where: { id },
        });
    }
    async getStatistics(filters) {
        const where = {};
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                const d = new Date(filters.startDate);
                if (!isNaN(d.getTime()))
                    where.createdAt.gte = d;
            }
            if (filters.endDate) {
                const d = new Date(filters.endDate);
                if (!isNaN(d.getTime()))
                    where.createdAt.lte = d;
            }
        }
        const [total, newOrders, inProduction, completed, cancelled] = await Promise.all([
            this.prisma.order.count({ where }),
            this.prisma.order.count({
                where: { ...where, status: client_1.OrderStatus.NEW },
            }),
            this.prisma.order.count({
                where: { ...where, status: client_1.OrderStatus.IN_PRODUCTION },
            }),
            this.prisma.order.count({
                where: { ...where, status: client_1.OrderStatus.COMPLETED },
            }),
            this.prisma.order.count({
                where: { ...where, status: client_1.OrderStatus.CANCELLED },
            }),
        ]);
        return {
            total,
            new: newOrders,
            inProduction,
            completed,
            cancelled,
        };
    }
    async exportToExcel(res, filters) {
        const result = await this.findAll({
            ...filters,
            limit: constants_1.PAGINATION.EXPORT_MAX_SIZE,
        });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Заказы");
        worksheet.columns = [
            { header: "№ Заказа", key: "orderNumber", width: 15 },
            { header: "Клиент", key: "customerName", width: 25 },
            { header: "Телефон", key: "customerPhone", width: 20 },
            { header: "Адрес", key: "customerAddress", width: 35 },
            { header: "Статус", key: "status", width: 20 },
            { header: "Источник", key: "source", width: 15 },
            {
                header: "Сумма",
                key: "totalAmount",
                width: 15,
                style: { numFmt: '#,##0.00" ₽";-#,##0.00" ₽"' },
            },
            { header: "Описание", key: "description", width: 35 },
            { header: "Кол-во продуктов", key: "productCount", width: 20 },
            { header: "Дата создания", key: "createdAt", width: 20 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
        };
        result.data.forEach((order) => {
            worksheet.addRow({
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress || "-",
                status: this.translateStatus(order.status),
                source: order.source?.name || "-",
                totalAmount: order.totalAmount ?? null,
                description: order.description || "-",
                productCount: order.products?.length || 0,
                createdAt: order.createdAt.toLocaleDateString("ru-RU"),
            });
        });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=orders_${new Date().toISOString().split("T")[0]}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
    translateStatus(status) {
        const translations = {
            [client_1.OrderStatus.NEW]: "Новый",
            [client_1.OrderStatus.IN_PRODUCTION]: "В производстве",
            [client_1.OrderStatus.COMPLETED]: "Завершен",
            [client_1.OrderStatus.CANCELLED]: "Отменен",
        };
        return translations[status] || status;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_gateway_1.NotificationsGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map