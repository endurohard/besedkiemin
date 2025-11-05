import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductionStage } from '@prisma/client';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
    findAll(orderId?: string, stage?: ProductionStage): Promise<({
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
    getByStage(stage: ProductionStage): Promise<({
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
    getHistory(id: string): Promise<({
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
    moveToStage(id: string, body: {
        stage: ProductionStage;
        notes?: string;
    }, req: any): Promise<{
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
}
