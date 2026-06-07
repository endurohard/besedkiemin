import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductionStage } from "@prisma/client";
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
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        };
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
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
    }>;
    createFromInventory(createProductDto: CreateProductDto): Promise<{
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
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        };
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
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
    }>;
    findAll(orderId?: string, stage?: ProductionStage): Promise<({
        order: {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            priority: import(".prisma/client").$Enums.OrderPriority;
            orderNumber: string;
            customerName: string;
        };
        productType: {
            name: string;
            id: string;
        };
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
        tasks: {
            status: import(".prisma/client").$Enums.TaskStatus;
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            isDefect: boolean;
            assignedTo: {
                role: {
                    name: string;
                    code: string;
                };
                firstName: string;
                lastName: string;
                id: string;
            };
        }[];
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
    })[]>;
    getByStage(stage: ProductionStage): Promise<({
        order: {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            priority: import(".prisma/client").$Enums.OrderPriority;
            orderNumber: string;
            customerName: string;
        };
        productType: {
            name: string;
            id: string;
        };
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
        tasks: {
            status: import(".prisma/client").$Enums.TaskStatus;
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
            isDefect: boolean;
            assignedTo: {
                role: {
                    name: string;
                    code: string;
                };
                firstName: string;
                lastName: string;
                id: string;
            };
        }[];
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
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        };
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
    }>;
    getHistory(id: string): Promise<({
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
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        };
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
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        };
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}
