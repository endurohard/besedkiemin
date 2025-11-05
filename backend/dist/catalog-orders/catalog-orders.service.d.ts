import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateCatalogOrderDto } from './dto/create-catalog-order.dto';
import { UpdateCatalogOrderDto } from './dto/update-catalog-order.dto';
export declare class CatalogOrdersService {
    private prisma;
    private telegramService;
    constructor(prisma: PrismaService, telegramService: TelegramService);
    create(createDto: CreateCatalogOrderDto): Promise<{
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number | null;
                order: number;
                name: string;
                slug: string;
                description: string | null;
                shortDesc: string | null;
                images: string[];
                dimensions: string | null;
                material: string | null;
                priceNote: string | null;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isActive: boolean;
                isFeatured: boolean;
                categoryId: string;
            };
        } & {
            id: string;
            comment: string | null;
            createdAt: Date;
            quantity: number;
            price: number | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        comment: string | null;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        deliveryAddress: string | null;
        totalAmount: number | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(status?: string): Promise<({
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number | null;
                order: number;
                name: string;
                slug: string;
                description: string | null;
                shortDesc: string | null;
                images: string[];
                dimensions: string | null;
                material: string | null;
                priceNote: string | null;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isActive: boolean;
                isFeatured: boolean;
                categoryId: string;
            };
        } & {
            id: string;
            comment: string | null;
            createdAt: Date;
            quantity: number;
            price: number | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        comment: string | null;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        deliveryAddress: string | null;
        totalAmount: number | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number | null;
                order: number;
                name: string;
                slug: string;
                description: string | null;
                shortDesc: string | null;
                images: string[];
                dimensions: string | null;
                material: string | null;
                priceNote: string | null;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isActive: boolean;
                isFeatured: boolean;
                categoryId: string;
            };
        } & {
            id: string;
            comment: string | null;
            createdAt: Date;
            quantity: number;
            price: number | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        comment: string | null;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        deliveryAddress: string | null;
        totalAmount: number | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateDto: UpdateCatalogOrderDto): Promise<{
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number | null;
                order: number;
                name: string;
                slug: string;
                description: string | null;
                shortDesc: string | null;
                images: string[];
                dimensions: string | null;
                material: string | null;
                priceNote: string | null;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isActive: boolean;
                isFeatured: boolean;
                categoryId: string;
            };
        } & {
            id: string;
            comment: string | null;
            createdAt: Date;
            quantity: number;
            price: number | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        comment: string | null;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        deliveryAddress: string | null;
        totalAmount: number | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        comment: string | null;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        deliveryAddress: string | null;
        totalAmount: number | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    markContacted(id: string, userId: string): Promise<{
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number | null;
                order: number;
                name: string;
                slug: string;
                description: string | null;
                shortDesc: string | null;
                images: string[];
                dimensions: string | null;
                material: string | null;
                priceNote: string | null;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isActive: boolean;
                isFeatured: boolean;
                categoryId: string;
            };
        } & {
            id: string;
            comment: string | null;
            createdAt: Date;
            quantity: number;
            price: number | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        comment: string | null;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        deliveryAddress: string | null;
        totalAmount: number | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    markProcessed(id: string, userId: string): Promise<{
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number | null;
                order: number;
                name: string;
                slug: string;
                description: string | null;
                shortDesc: string | null;
                images: string[];
                dimensions: string | null;
                material: string | null;
                priceNote: string | null;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isActive: boolean;
                isFeatured: boolean;
                categoryId: string;
            };
        } & {
            id: string;
            comment: string | null;
            createdAt: Date;
            quantity: number;
            price: number | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        comment: string | null;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        deliveryAddress: string | null;
        totalAmount: number | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancelOrder(id: string, cancellationReason: string, userId: string): Promise<{
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: number | null;
                order: number;
                name: string;
                slug: string;
                description: string | null;
                shortDesc: string | null;
                images: string[];
                dimensions: string | null;
                material: string | null;
                priceNote: string | null;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isActive: boolean;
                isFeatured: boolean;
                categoryId: string;
            };
        } & {
            id: string;
            comment: string | null;
            createdAt: Date;
            quantity: number;
            price: number | null;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string | null;
        comment: string | null;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        deliveryAddress: string | null;
        totalAmount: number | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
