import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductionStage } from '@prisma/client';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<{
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            priority: import(".prisma/client").$Enums.OrderPriority;
            notes: string | null;
            customerAddress: string | null;
            createdById: string;
        };
        productType: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            productionTimeHours: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        orderId: string;
        name: string;
        description: string | null;
        dimensions: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        schemaImageUrl: string | null;
        deadline: Date | null;
        productTypeId: string;
    }>;
    findAll(orderId?: string, stage?: ProductionStage): Promise<({
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            status: import(".prisma/client").$Enums.OrderStatus;
        };
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.QualityStatus;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            notes: string | null;
            photoUrl: string | null;
            checkedAt: Date | null;
            checkedById: string | null;
        })[];
        history: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        orderId: string;
        name: string;
        description: string | null;
        dimensions: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        schemaImageUrl: string | null;
        deadline: Date | null;
        productTypeId: string;
    })[]>;
    getByStage(stage: ProductionStage): Promise<({
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            status: import(".prisma/client").$Enums.OrderStatus;
        };
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.QualityStatus;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            notes: string | null;
            photoUrl: string | null;
            checkedAt: Date | null;
            checkedById: string | null;
        })[];
        history: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        orderId: string;
        name: string;
        description: string | null;
        dimensions: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        schemaImageUrl: string | null;
        deadline: Date | null;
        productTypeId: string;
    })[]>;
    findOne(id: string): Promise<{
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            priority: import(".prisma/client").$Enums.OrderPriority;
            notes: string | null;
            customerAddress: string | null;
            createdById: string;
        };
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.QualityStatus;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            notes: string | null;
            photoUrl: string | null;
            checkedAt: Date | null;
            checkedById: string | null;
        })[];
        history: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        orderId: string;
        name: string;
        description: string | null;
        dimensions: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        schemaImageUrl: string | null;
        deadline: Date | null;
        productTypeId: string;
    }>;
    getHistory(id: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        stage: import(".prisma/client").$Enums.ProductionStage;
        completedAt: Date | null;
        passedAt: Date | null;
        notes: string | null;
        workflowStageId: string | null;
        startedAt: Date;
        userId: string;
    })[]>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<{
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            priority: import(".prisma/client").$Enums.OrderPriority;
            notes: string | null;
            customerAddress: string | null;
            createdById: string;
        };
        history: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        orderId: string;
        name: string;
        description: string | null;
        dimensions: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        schemaImageUrl: string | null;
        deadline: Date | null;
        productTypeId: string;
    }>;
    moveToStage(id: string, body: {
        stage: ProductionStage;
        notes?: string;
    }, req: any): Promise<{
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            priority: import(".prisma/client").$Enums.OrderPriority;
            notes: string | null;
            customerAddress: string | null;
            createdById: string;
        };
        history: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            completedAt: Date | null;
            passedAt: Date | null;
            notes: string | null;
            workflowStageId: string | null;
            startedAt: Date;
            userId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        orderId: string;
        name: string;
        description: string | null;
        dimensions: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        schemaImageUrl: string | null;
        deadline: Date | null;
        productTypeId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        orderId: string;
        name: string;
        description: string | null;
        dimensions: string | null;
        stage: import(".prisma/client").$Enums.ProductionStage;
        schemaImageUrl: string | null;
        deadline: Date | null;
        productTypeId: string;
    }>;
}
