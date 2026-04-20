import { QualityChecksService } from "./quality-checks.service";
import { CreateQualityCheckDto } from "./dto/create-quality-check.dto";
import { UpdateQualityCheckDto } from "./dto/update-quality-check.dto";
import { QualityStatus } from "@prisma/client";
import { UploadService } from "../upload/upload.service";
export declare class QualityChecksController {
    private readonly qualityChecksService;
    private readonly uploadService;
    constructor(qualityChecksService: QualityChecksService, uploadService: UploadService);
    create(createQualityCheckDto: CreateQualityCheckDto, file: Express.Multer.File, req: any): Promise<{
        product: {
            order: {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.OrderStatus;
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
        } & {
            name: string;
            description: string | null;
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
            isCustom: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        };
        checkedBy: {
            role: {
                order: number;
                name: string;
                description: string | null;
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
    }>;
    findAll(productId?: string, status?: QualityStatus): Promise<({
        product: {
            productType: {
                name: string;
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                requiresSewing: boolean;
                productionTimeHours: number | null;
            };
            name: string;
            id: string;
            orderId: string;
        };
        checkedBy: {
            role: {
                order: number;
                name: string;
                description: string | null;
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
    })[]>;
    getRejected(): Promise<({
        product: {
            productType: {
                name: string;
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                requiresSewing: boolean;
                productionTimeHours: number | null;
            };
            name: string;
            id: string;
            orderId: string;
        };
        checkedBy: {
            role: {
                order: number;
                name: string;
                description: string | null;
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
    })[]>;
    getByProduct(productId: string): Promise<({
        product: {
            productType: {
                name: string;
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                requiresSewing: boolean;
                productionTimeHours: number | null;
            };
            name: string;
            id: string;
            orderId: string;
        };
        checkedBy: {
            role: {
                order: number;
                name: string;
                description: string | null;
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
    })[]>;
    findOne(id: string): Promise<{
        product: {
            order: {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.OrderStatus;
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
        } & {
            name: string;
            description: string | null;
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
            isCustom: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        };
        checkedBy: {
            role: {
                order: number;
                name: string;
                description: string | null;
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
    }>;
    update(id: string, updateQualityCheckDto: UpdateQualityCheckDto, file: Express.Multer.File): Promise<{
        product: {
            name: string;
            description: string | null;
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
            isCustom: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        };
        checkedBy: {
            role: {
                order: number;
                name: string;
                description: string | null;
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
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.QualityStatus;
        notes: string | null;
        productId: string;
        photoUrl: string | null;
        checkedAt: Date | null;
        checkedById: string | null;
    }>;
}
