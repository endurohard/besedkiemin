import { Response } from "express";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { OrderStatus } from "@prisma/client";
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto, user: AuthenticatedUser): Promise<{
        source: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            code: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        } | null;
        createdBy: {
            role: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                code: string;
                color: string | null;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
        products: ({
            history: ({
                user: {
                    role: {
                        description: string | null;
                        order: number;
                        name: string;
                        isActive: boolean;
                        id: string;
                        code: string;
                        color: string | null;
                        isSystem: boolean;
                        permissions: import("@prisma/client/runtime/library").JsonValue;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    firstName: string;
                    lastName: string;
                    id: string;
                };
            } & {
                status: import(".prisma/client").$Enums.TaskStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                completedAt: Date | null;
                passedAt: Date | null;
                notes: string | null;
                productId: string;
                workflowStageId: string | null;
                userId: string;
                startedAt: Date;
            })[];
        } & {
            description: string | null;
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            productTypeId: string;
            orderId: string;
            dimensions: string | null;
            schemaImageUrl: string | null;
            schemaImageUrls: string[];
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
            isCustom: boolean;
            needsDesign: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.OrderPriority;
        notes: string | null;
        orderNumber: string;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        sourceId: string | null;
        totalAmount: number | null;
        createdById: string;
    }>;
    findAll(status?: OrderStatus, startDate?: string, endDate?: string, page?: string, limit?: string): Promise<{
        data: {
            status: import(".prisma/client").$Enums.OrderStatus;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                products: number;
            };
            priority: import(".prisma/client").$Enums.OrderPriority;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            customerAddress: string | null;
            sourceId: string | null;
            totalAmount: number | null;
            source: {
                name: string;
                id: string;
                code: string;
                color: string | null;
                icon: string | null;
            } | null;
            createdBy: {
                firstName: string;
                lastName: string;
                id: string;
            };
            products: {
                productType: {
                    name: string;
                    id: string;
                };
                name: string;
                id: string;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
            }[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStatistics(startDate?: string, endDate?: string): Promise<{
        total: number;
        new: number;
        inProduction: number;
        completed: number;
        cancelled: number;
    }>;
    exportToExcel(res: Response, status?: OrderStatus, startDate?: string, endDate?: string): Promise<void>;
    findOne(id: string): Promise<{
        source: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            code: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        } | null;
        createdBy: {
            role: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                code: string;
                color: string | null;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
        products: ({
            productType: {
                name: string;
                id: string;
            };
            nomenclature: {
                name: string;
                id: string;
                color: string | null;
            } | null;
            qualityChecks: ({
                checkedBy: {
                    firstName: string;
                    lastName: string;
                    id: string;
                } | null;
            } & {
                status: import(".prisma/client").$Enums.QualityStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                productId: string;
                photoUrl: string | null;
                checkedAt: Date | null;
                checkedById: string | null;
            })[];
            tasks: ({
                assignedTo: {
                    role: {
                        name: string;
                        code: string;
                    };
                    firstName: string;
                    lastName: string;
                    id: string;
                };
            } & {
                status: import(".prisma/client").$Enums.TaskStatus;
                description: string | null;
                title: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                quantity: number;
                priority: import(".prisma/client").$Enums.TaskPriority;
                acceptedAt: Date | null;
                completedAt: Date | null;
                passedAt: Date | null;
                rejectedAt: Date | null;
                notes: string | null;
                defectPhotos: string[];
                isDefect: boolean;
                quantityProcessed: number;
                productId: string;
                assignedToId: string;
                workflowStageId: string | null;
            })[];
            history: ({
                user: {
                    role: {
                        description: string | null;
                        order: number;
                        name: string;
                        isActive: boolean;
                        id: string;
                        code: string;
                        color: string | null;
                        isSystem: boolean;
                        permissions: import("@prisma/client/runtime/library").JsonValue;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    firstName: string;
                    lastName: string;
                    id: string;
                };
                workflowStage: {
                    order: number;
                    name: string;
                    id: string;
                } | null;
            } & {
                status: import(".prisma/client").$Enums.TaskStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                completedAt: Date | null;
                passedAt: Date | null;
                notes: string | null;
                productId: string;
                workflowStageId: string | null;
                userId: string;
                startedAt: Date;
            })[];
        } & {
            description: string | null;
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            productTypeId: string;
            orderId: string;
            dimensions: string | null;
            schemaImageUrl: string | null;
            schemaImageUrls: string[];
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
            isCustom: boolean;
            needsDesign: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.OrderPriority;
        notes: string | null;
        orderNumber: string;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        sourceId: string | null;
        totalAmount: number | null;
        createdById: string;
    }>;
    update(id: string, updateOrderDto: UpdateOrderDto): Promise<{
        source: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            code: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
        } | null;
        createdBy: {
            role: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                code: string;
                color: string | null;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
        products: {
            description: string | null;
            name: string;
            id: string;
            color: string | null;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            productTypeId: string;
            orderId: string;
            dimensions: string | null;
            schemaImageUrl: string | null;
            schemaImageUrls: string[];
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
            isCustom: boolean;
            needsDesign: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.OrderPriority;
        notes: string | null;
        orderNumber: string;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        sourceId: string | null;
        totalAmount: number | null;
        createdById: string;
    }>;
    remove(id: string): Promise<{
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        priority: import(".prisma/client").$Enums.OrderPriority;
        notes: string | null;
        orderNumber: string;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        sourceId: string | null;
        totalAmount: number | null;
        createdById: string;
    }>;
}
