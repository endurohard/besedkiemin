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
        };
        checkedBy: {
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    }>;
    findAll(filters?: {
        productId?: string;
        status?: QualityStatus;
    }): Promise<({
        product: {
            productType: {
                description: string | null;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                productionTimeHours: number | null;
            };
            name: string;
            id: string;
            orderId: string;
        };
        checkedBy: {
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    })[]>;
    findOne(id: string): Promise<{
        product: {
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
        };
        checkedBy: {
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    }>;
    update(id: string, updateQualityCheckDto: UpdateQualityCheckDto, photoFile?: Express.Multer.File): Promise<{
        product: {
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
        };
        checkedBy: {
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    }>;
    remove(id: string): Promise<{
        status: import(".prisma/client").$Enums.QualityStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        productId: string;
        photoUrl: string | null;
        checkedAt: Date | null;
        checkedById: string | null;
    }>;
    getByProduct(productId: string): Promise<({
        product: {
            productType: {
                description: string | null;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                productionTimeHours: number | null;
            };
            name: string;
            id: string;
            orderId: string;
        };
        checkedBy: {
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    })[]>;
    getRejected(): Promise<({
        product: {
            productType: {
                description: string | null;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                productionTimeHours: number | null;
            };
            name: string;
            id: string;
            orderId: string;
        };
        checkedBy: {
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
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
    })[]>;
}
