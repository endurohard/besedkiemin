import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductionStage } from '@prisma/client';
export declare class ProductsService {
    private prisma;
    private telegramService;
    constructor(prisma: PrismaService, telegramService: TelegramService);
    create(createProductDto: CreateProductDto): Promise<{
        order: {
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
            createdById: string;
        };
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productionTimeHours: number | null;
        };
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        productTypeId: string;
        orderId: string;
        dimensions: string | null;
        schemaImageUrl: string | null;
        deadline: Date | null;
    }>;
    findAll(filters?: {
        orderId?: string;
        stage?: ProductionStage;
    }): Promise<({
        order: {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            orderNumber: string;
            customerName: string;
        };
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
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            productId: string;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        productTypeId: string;
        orderId: string;
        dimensions: string | null;
        schemaImageUrl: string | null;
        deadline: Date | null;
    })[]>;
    findOne(id: string): Promise<{
        order: {
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
            createdById: string;
        };
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
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            productId: string;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        productTypeId: string;
        orderId: string;
        dimensions: string | null;
        schemaImageUrl: string | null;
        deadline: Date | null;
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<{
        order: {
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
            createdById: string;
        };
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
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            productId: string;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        productTypeId: string;
        orderId: string;
        dimensions: string | null;
        schemaImageUrl: string | null;
        deadline: Date | null;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        productTypeId: string;
        orderId: string;
        dimensions: string | null;
        schemaImageUrl: string | null;
        deadline: Date | null;
    }>;
    moveToStage(productId: string, newStage: ProductionStage, userId: string, notes?: string): Promise<{
        order: {
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
            createdById: string;
        };
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
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            productId: string;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        productTypeId: string;
        orderId: string;
        dimensions: string | null;
        schemaImageUrl: string | null;
        deadline: Date | null;
    }>;
    getProductsByStage(stage: ProductionStage): Promise<({
        order: {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            orderNumber: string;
            customerName: string;
        };
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
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            productId: string;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        stage: import(".prisma/client").$Enums.ProductionStage;
        quantity: number;
        productTypeId: string;
        orderId: string;
        dimensions: string | null;
        schemaImageUrl: string | null;
        deadline: Date | null;
    })[]>;
    getProductHistory(productId: string): Promise<({
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
        stage: import(".prisma/client").$Enums.ProductionStage;
        completedAt: Date | null;
        passedAt: Date | null;
        notes: string | null;
        productId: string;
        workflowStageId: string | null;
        startedAt: Date;
        userId: string;
    })[]>;
    private validateStageTransition;
    private updateOrderStatus;
}
