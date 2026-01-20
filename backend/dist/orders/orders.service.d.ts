import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { Response } from 'express';
export declare class OrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createOrderDto: CreateOrderDto, userId: string): Promise<{
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
        };
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
                permissions: Prisma.JsonValue;
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
                        permissions: Prisma.JsonValue;
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
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
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
    findAll(filters?: {
        status?: OrderStatus;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            status: import(".prisma/client").$Enums.OrderStatus;
            description: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                products: number;
            };
            priority: import(".prisma/client").$Enums.OrderPriority;
            orderNumber: string;
            customerName: string;
            customerPhone: string;
            customerAddress: string;
            sourceId: string;
            totalAmount: number;
            source: {
                name: string;
                id: string;
                code: string;
                color: string;
                icon: string;
            };
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
        };
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
                permissions: Prisma.JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
        products: ({
            qualityChecks: ({
                checkedBy: {
                    firstName: string;
                    lastName: string;
                    id: string;
                };
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
                        permissions: Prisma.JsonValue;
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
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
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
        };
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
                permissions: Prisma.JsonValue;
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
            deadline: Date | null;
            requiresSewing: boolean | null;
            upholsteryMaterial: string | null;
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
    getStatistics(filters?: {
        startDate?: string;
        endDate?: string;
    }): Promise<{
        total: number;
        new: number;
        inProduction: number;
        completed: number;
        cancelled: number;
    }>;
    exportToExcel(res: Response, filters?: {
        status?: OrderStatus;
        startDate?: string;
        endDate?: string;
    }): Promise<void>;
    private translateStatus;
}
