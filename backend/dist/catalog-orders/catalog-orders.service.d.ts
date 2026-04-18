import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateCatalogOrderDto } from './dto/create-catalog-order.dto';
import { UpdateCatalogOrderDto } from './dto/update-catalog-order.dto';
import { Prisma } from '@prisma/client';
export declare class CatalogOrdersService {
    private prisma;
    private telegramService;
    private readonly logger;
    constructor(prisma: PrismaService, telegramService: TelegramService);
    create(createDto: CreateCatalogOrderDto): Promise<{
        items: ({
            product: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                dimensions: string | null;
                slug: string;
                categoryId: string;
                shortDesc: string | null;
                images: string[];
                material: string | null;
                price: number | null;
                priceNote: string | null;
                features: Prisma.JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isFeatured: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            productId: string;
            orderId: string;
            price: number | null;
            comment: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        comment: string | null;
        customerEmail: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    findAll(filters?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            items: ({
                product: {
                    description: string | null;
                    order: number;
                    name: string;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    dimensions: string | null;
                    slug: string;
                    categoryId: string;
                    shortDesc: string | null;
                    images: string[];
                    material: string | null;
                    price: number | null;
                    priceNote: string | null;
                    features: Prisma.JsonValue | null;
                    metaTitle: string | null;
                    metaDescription: string | null;
                    metaKeywords: string | null;
                    isFeatured: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                quantity: number;
                productId: string;
                orderId: string;
                price: number | null;
                comment: string | null;
            })[];
        } & {
            status: import(".prisma/client").$Enums.CatalogOrderStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orderNumber: string;
            customerName: string;
            customerPhone: string;
            totalAmount: number | null;
            deliveryAddress: string | null;
            comment: string | null;
            customerEmail: string | null;
            cancellationReason: string | null;
            contactedAt: Date | null;
            contactedBy: string | null;
            processedAt: Date | null;
            processedBy: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        items: ({
            product: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                dimensions: string | null;
                slug: string;
                categoryId: string;
                shortDesc: string | null;
                images: string[];
                material: string | null;
                price: number | null;
                priceNote: string | null;
                features: Prisma.JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isFeatured: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            productId: string;
            orderId: string;
            price: number | null;
            comment: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        comment: string | null;
        customerEmail: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    update(id: string, updateDto: UpdateCatalogOrderDto): Promise<{
        items: ({
            product: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                dimensions: string | null;
                slug: string;
                categoryId: string;
                shortDesc: string | null;
                images: string[];
                material: string | null;
                price: number | null;
                priceNote: string | null;
                features: Prisma.JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isFeatured: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            productId: string;
            orderId: string;
            price: number | null;
            comment: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        comment: string | null;
        customerEmail: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    remove(id: string): Promise<{
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        comment: string | null;
        customerEmail: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    markContacted(id: string, userId: string): Promise<{
        items: ({
            product: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                dimensions: string | null;
                slug: string;
                categoryId: string;
                shortDesc: string | null;
                images: string[];
                material: string | null;
                price: number | null;
                priceNote: string | null;
                features: Prisma.JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isFeatured: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            productId: string;
            orderId: string;
            price: number | null;
            comment: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        comment: string | null;
        customerEmail: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    markProcessed(id: string, userId: string): Promise<{
        items: ({
            product: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                dimensions: string | null;
                slug: string;
                categoryId: string;
                shortDesc: string | null;
                images: string[];
                material: string | null;
                price: number | null;
                priceNote: string | null;
                features: Prisma.JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isFeatured: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            productId: string;
            orderId: string;
            price: number | null;
            comment: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        comment: string | null;
        customerEmail: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    cancelOrder(id: string, cancellationReason: string, userId: string): Promise<{
        items: ({
            product: {
                description: string | null;
                order: number;
                name: string;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                dimensions: string | null;
                slug: string;
                categoryId: string;
                shortDesc: string | null;
                images: string[];
                material: string | null;
                price: number | null;
                priceNote: string | null;
                features: Prisma.JsonValue | null;
                metaTitle: string | null;
                metaDescription: string | null;
                metaKeywords: string | null;
                isFeatured: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            productId: string;
            orderId: string;
            price: number | null;
            comment: string | null;
        })[];
    } & {
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        comment: string | null;
        customerEmail: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
}
