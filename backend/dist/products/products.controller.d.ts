import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductionStage } from "@prisma/client";
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<{
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
        productType: {
            id: string;
            name: string;
            description: string | null;
            requiresSewing: boolean;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            productionTimeHours: number | null;
        };
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
        isCustom: boolean;
        stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
        nomenclatureId: string | null;
    }>;
    createFromInventory(createProductDto: CreateProductDto): Promise<{
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
        productType: {
            id: string;
            name: string;
            description: string | null;
            requiresSewing: boolean;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            productionTimeHours: number | null;
        };
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
        isCustom: boolean;
        stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
        nomenclatureId: string | null;
    }>;
    findAll(orderId?: string, stage?: ProductionStage): Promise<({
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            priority: import(".prisma/client").$Enums.OrderPriority;
        };
        productType: {
            id: string;
            name: string;
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
            workflowStageId: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
        })[];
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
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
        isCustom: boolean;
        stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
        nomenclatureId: string | null;
    })[]>;
    getByStage(stage: ProductionStage): Promise<({
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            priority: import(".prisma/client").$Enums.OrderPriority;
        };
        productType: {
            id: string;
            name: string;
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
            workflowStageId: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
        })[];
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
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
        isCustom: boolean;
        stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
        nomenclatureId: string | null;
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
            workflowStageId: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
        })[];
        qualityChecks: ({
            checkedBy: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
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
        isCustom: boolean;
        stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
        nomenclatureId: string | null;
    }>;
    getHistory(id: string): Promise<({
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
        workflowStageId: string | null;
        startedAt: Date;
        completedAt: Date | null;
        passedAt: Date | null;
        productId: string;
        userId: string;
    })[]>;
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
            workflowStageId: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
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
        isCustom: boolean;
        stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
        nomenclatureId: string | null;
    }>;
    moveToStage(id: string, body: {
        stage: ProductionStage;
        notes?: string;
    }, req: any): Promise<{
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
            workflowStageId: string | null;
            startedAt: Date;
            completedAt: Date | null;
            passedAt: Date | null;
            productId: string;
            userId: string;
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
        isCustom: boolean;
        stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
        nomenclatureId: string | null;
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
        isCustom: boolean;
        stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        orderId: string;
        nomenclatureId: string | null;
    }>;
}
