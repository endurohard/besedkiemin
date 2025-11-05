import { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto, user: any): Promise<{
        createdBy: {
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
        };
        products: ({
            history: ({
                user: {
                    firstName: string;
                    lastName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    id: string;
                };
            } & {
                status: import(".prisma/client").$Enums.TaskStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                startedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                completedAt: Date | null;
                passedAt: Date | null;
                productId: string;
                userId: string;
                workflowStageId: string | null;
            })[];
        } & {
            description: string | null;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            dimensions: string | null;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
            orderId: string;
        })[];
    } & {
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        notes: string | null;
        priority: import(".prisma/client").$Enums.OrderPriority;
        orderNumber: string;
        createdById: string;
    }>;
    findAll(status?: OrderStatus, startDate?: string, endDate?: string): Promise<({
        createdBy: {
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
        };
        products: ({
            history: ({
                user: {
                    firstName: string;
                    lastName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    id: string;
                };
            } & {
                status: import(".prisma/client").$Enums.TaskStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                startedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                completedAt: Date | null;
                passedAt: Date | null;
                productId: string;
                userId: string;
                workflowStageId: string | null;
            })[];
        } & {
            description: string | null;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            dimensions: string | null;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
            orderId: string;
        })[];
    } & {
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        notes: string | null;
        priority: import(".prisma/client").$Enums.OrderPriority;
        orderNumber: string;
        createdById: string;
    })[]>;
    getStatistics(startDate?: string, endDate?: string): Promise<{
        total: number;
        new: number;
        inProduction: number;
        completed: number;
        cancelled: number;
    }>;
    exportToExcel(res: Response, status?: OrderStatus, startDate?: string, endDate?: string): Promise<void>;
    findOne(id: string): Promise<{
        createdBy: {
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
                    firstName: string;
                    lastName: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    id: string;
                };
            } & {
                status: import(".prisma/client").$Enums.TaskStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                startedAt: Date;
                stage: import(".prisma/client").$Enums.ProductionStage;
                completedAt: Date | null;
                passedAt: Date | null;
                productId: string;
                userId: string;
                workflowStageId: string | null;
            })[];
        } & {
            description: string | null;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            dimensions: string | null;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
            orderId: string;
        })[];
    } & {
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        notes: string | null;
        priority: import(".prisma/client").$Enums.OrderPriority;
        orderNumber: string;
        createdById: string;
    }>;
    update(id: string, updateOrderDto: UpdateOrderDto): Promise<{
        createdBy: {
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
        };
        products: {
            description: string | null;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            stage: import(".prisma/client").$Enums.ProductionStage;
            quantity: number;
            dimensions: string | null;
            schemaImageUrl: string | null;
            deadline: Date | null;
            productTypeId: string;
            orderId: string;
        }[];
    } & {
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        notes: string | null;
        priority: import(".prisma/client").$Enums.OrderPriority;
        orderNumber: string;
        createdById: string;
    }>;
    remove(id: string): Promise<{
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string;
        customerPhone: string | null;
        customerAddress: string | null;
        notes: string | null;
        priority: import(".prisma/client").$Enums.OrderPriority;
        orderNumber: string;
        createdById: string;
    }>;
}
