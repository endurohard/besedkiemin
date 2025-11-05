import { PrismaService } from '../prisma/prisma.service';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { UpdateQualityCheckDto } from './dto/update-quality-check.dto';
import { QualityStatus } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class QualityChecksService {
    private prisma;
    private uploadService;
    private telegramService;
    constructor(prisma: PrismaService, uploadService: UploadService, telegramService: TelegramService);
    create(createQualityCheckDto: CreateQualityCheckDto, userId: string, photoFile?: Express.Multer.File): Promise<{
        product: {
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
        };
        checkedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    }>;
    findAll(filters?: {
        productId?: string;
        status?: QualityStatus;
    }): Promise<({
        product: {
            id: string;
            orderId: string;
            name: string;
            productType: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                productionTimeHours: number | null;
            };
        };
        checkedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    })[]>;
    findOne(id: string): Promise<{
        product: {
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
        };
        checkedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    }>;
    update(id: string, updateQualityCheckDto: UpdateQualityCheckDto, photoFile?: Express.Multer.File): Promise<{
        product: {
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
        };
        checkedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    }>;
    remove(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.QualityStatus;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        notes: string | null;
        photoUrl: string | null;
        checkedAt: Date | null;
        checkedById: string | null;
    }>;
    getByProduct(productId: string): Promise<({
        product: {
            id: string;
            orderId: string;
            name: string;
            productType: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                productionTimeHours: number | null;
            };
        };
        checkedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    })[]>;
    getRejected(): Promise<({
        product: {
            id: string;
            orderId: string;
            name: string;
            productType: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                productionTimeHours: number | null;
            };
        };
        checkedBy: {
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    })[]>;
}
