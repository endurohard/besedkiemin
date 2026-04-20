import { CatalogOrdersService } from "./catalog-orders.service";
import { CreateCatalogOrderDto } from "./dto/create-catalog-order.dto";
import { UpdateCatalogOrderDto } from "./dto/update-catalog-order.dto";
export declare class CatalogOrdersController {
    private readonly ordersService;
    constructor(ordersService: CatalogOrdersService);
    create(createDto: CreateCatalogOrderDto): Promise<{
        items: ({
            product: {
                order: number;
                name: string;
                description: string | null;
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
                features: import("@prisma/client/runtime/library").JsonValue | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        customerEmail: string | null;
        comment: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    findAll(status?: string, page?: string, limit?: string): Promise<{
        data: ({
            items: ({
                product: {
                    order: number;
                    name: string;
                    description: string | null;
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
                    features: import("@prisma/client/runtime/library").JsonValue | null;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.CatalogOrderStatus;
            orderNumber: string;
            customerName: string;
            customerPhone: string;
            totalAmount: number | null;
            deliveryAddress: string | null;
            customerEmail: string | null;
            comment: string | null;
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
                order: number;
                name: string;
                description: string | null;
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
                features: import("@prisma/client/runtime/library").JsonValue | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        customerEmail: string | null;
        comment: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    update(id: string, updateDto: UpdateCatalogOrderDto): Promise<{
        items: ({
            product: {
                order: number;
                name: string;
                description: string | null;
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
                features: import("@prisma/client/runtime/library").JsonValue | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        customerEmail: string | null;
        comment: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        customerEmail: string | null;
        comment: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    markContacted(id: string, req: any): Promise<{
        items: ({
            product: {
                order: number;
                name: string;
                description: string | null;
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
                features: import("@prisma/client/runtime/library").JsonValue | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        customerEmail: string | null;
        comment: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    markProcessed(id: string, req: any): Promise<{
        items: ({
            product: {
                order: number;
                name: string;
                description: string | null;
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
                features: import("@prisma/client/runtime/library").JsonValue | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        customerEmail: string | null;
        comment: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
    cancelOrder(id: string, cancellationReason: string, req: any): Promise<{
        items: ({
            product: {
                order: number;
                name: string;
                description: string | null;
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
                features: import("@prisma/client/runtime/library").JsonValue | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CatalogOrderStatus;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        totalAmount: number | null;
        deliveryAddress: string | null;
        customerEmail: string | null;
        comment: string | null;
        cancellationReason: string | null;
        contactedAt: Date | null;
        contactedBy: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }>;
}
