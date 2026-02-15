import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductionStage } from '@prisma/client';
export declare class ProductsService {
    private prisma;
    private telegramService;
    private readonly logger;
    constructor(prisma: PrismaService, telegramService: TelegramService);
    create(createProductDto: CreateProductDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        quantity: number;
        dimensions: string | null;
        schemaImageUrl: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        deadline: Date | null;
        requiresSewing: boolean | null;
        color: string | null;
        upholsteryMaterial: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
    }>;
    findAll(filters?: {
        orderId?: string;
        stage?: ProductionStage;
    }): Promise<({
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            status: import(".prisma/client").$Enums.OrderStatus;
        };
        history: ({
            user: {
                role: {
                    order: number;
                    id: string;
                    name: string;
                    description: string | null;
                    color: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    code: string;
                    isSystem: boolean;
                    permissions: import("@prisma/client/runtime/library").JsonValue;
                };
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            notes: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
            workflowStageId: string | null;
        })[];
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.QualityStatus;
            notes: string | null;
            productId: string;
            photoUrl: string | null;
            checkedAt: Date | null;
            checkedById: string | null;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        quantity: number;
        dimensions: string | null;
        schemaImageUrl: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        deadline: Date | null;
        requiresSewing: boolean | null;
        color: string | null;
        upholsteryMaterial: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
    })[]>;
    findOne(id: string): Promise<{
        order: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            customerAddress: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            priority: import(".prisma/client").$Enums.OrderPriority;
            notes: string | null;
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        };
        history: ({
            user: {
                role: {
                    order: number;
                    id: string;
                    name: string;
                    description: string | null;
                    color: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    code: string;
                    isSystem: boolean;
                    permissions: import("@prisma/client/runtime/library").JsonValue;
                };
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            notes: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
            workflowStageId: string | null;
        })[];
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.QualityStatus;
            notes: string | null;
            productId: string;
            photoUrl: string | null;
            checkedAt: Date | null;
            checkedById: string | null;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        quantity: number;
        dimensions: string | null;
        schemaImageUrl: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        deadline: Date | null;
        requiresSewing: boolean | null;
        color: string | null;
        upholsteryMaterial: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<{
        order: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            customerAddress: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            priority: import(".prisma/client").$Enums.OrderPriority;
            notes: string | null;
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        };
        history: ({
            user: {
                role: {
                    order: number;
                    id: string;
                    name: string;
                    description: string | null;
                    color: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    code: string;
                    isSystem: boolean;
                    permissions: import("@prisma/client/runtime/library").JsonValue;
                };
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            notes: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
            workflowStageId: string | null;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        quantity: number;
        dimensions: string | null;
        schemaImageUrl: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        deadline: Date | null;
        requiresSewing: boolean | null;
        color: string | null;
        upholsteryMaterial: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        quantity: number;
        dimensions: string | null;
        schemaImageUrl: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        deadline: Date | null;
        requiresSewing: boolean | null;
        color: string | null;
        upholsteryMaterial: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
    }>;
    moveToStage(productId: string, newStage: ProductionStage, userId: string, notes?: string): Promise<{
        order: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            customerAddress: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            priority: import(".prisma/client").$Enums.OrderPriority;
            notes: string | null;
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        };
        history: ({
            user: {
                role: {
                    order: number;
                    id: string;
                    name: string;
                    description: string | null;
                    color: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    code: string;
                    isSystem: boolean;
                    permissions: import("@prisma/client/runtime/library").JsonValue;
                };
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            notes: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
            workflowStageId: string | null;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        quantity: number;
        dimensions: string | null;
        schemaImageUrl: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        deadline: Date | null;
        requiresSewing: boolean | null;
        color: string | null;
        upholsteryMaterial: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
    }>;
    getProductsByStage(stage: ProductionStage): Promise<({
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            status: import(".prisma/client").$Enums.OrderStatus;
        };
        history: ({
            user: {
                role: {
                    order: number;
                    id: string;
                    name: string;
                    description: string | null;
                    color: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    code: string;
                    isSystem: boolean;
                    permissions: import("@prisma/client/runtime/library").JsonValue;
                };
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            notes: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
            workflowStageId: string | null;
        })[];
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.QualityStatus;
            notes: string | null;
            productId: string;
            photoUrl: string | null;
            checkedAt: Date | null;
            checkedById: string | null;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        quantity: number;
        dimensions: string | null;
        schemaImageUrl: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        deadline: Date | null;
        requiresSewing: boolean | null;
        color: string | null;
        upholsteryMaterial: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
    })[]>;
    getProductHistory(productId: string): Promise<({
        user: {
            role: {
                order: number;
                id: string;
                name: string;
                description: string | null;
                color: string | null;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                code: string;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        notes: string | null;
        startedAt: Date;
        completedAt: Date | null;
        passedAt: Date | null;
        productId: string;
        userId: string;
        workflowStageId: string | null;
    })[]>;
    private validateStageTransition;
    private updateOrderStatus;
}
