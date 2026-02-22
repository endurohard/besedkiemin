import { PrismaService } from '../prisma/prisma.service';
import { ShipmentStatus } from '@prisma/client';
export declare class ShipmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    createShipment(userId: string, data: {
        items: Array<{
            inventoryItemId: string;
            quantity: number;
        }>;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate?: Date;
        notes?: string;
        orderNumber?: string;
    }): Promise<{
        items: ({
            inventoryItem: {
                productType: {
                    name: string;
                    id: string;
                };
                name: string;
                id: string;
                quantity: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            shipmentId: string;
            inventoryItemId: string;
        })[];
        shippedBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ShipmentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderNumber: string | null;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    }>;
    getAllShipments(userId: string, options?: {
        status?: ShipmentStatus;
    }): Promise<{
        status: import(".prisma/client").$Enums.ShipmentStatus;
        items: {
            inventoryItem: {
                productType: {
                    name: string;
                    id: string;
                };
                name: string;
                id: string;
            };
            id: string;
            quantity: number;
        }[];
        id: string;
        createdAt: Date;
        _count: {
            items: number;
        };
        notes: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: Date;
        shippedBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    }[]>;
    getShipmentsByStatus(userId: string, status: ShipmentStatus): Promise<({
        items: ({
            inventoryItem: {
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
                product: {
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
                    deadline: Date | null;
                    requiresSewing: boolean | null;
                    upholsteryMaterial: string | null;
                    nomenclatureId: string | null;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                quantity: number;
                notes: string | null;
                productId: string | null;
                productTypeId: string;
                orderId: string | null;
                receivedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            shipmentId: string;
            inventoryItemId: string;
        })[];
        shippedBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ShipmentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderNumber: string | null;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    })[]>;
    getShipment(id: string): Promise<{
        items: ({
            inventoryItem: {
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
                product: {
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
                    deadline: Date | null;
                    requiresSewing: boolean | null;
                    upholsteryMaterial: string | null;
                    nomenclatureId: string | null;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                quantity: number;
                notes: string | null;
                productId: string | null;
                productTypeId: string;
                orderId: string | null;
                receivedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            shipmentId: string;
            inventoryItemId: string;
        })[];
        shippedBy: {
            email: string;
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ShipmentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderNumber: string | null;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    }>;
    updateShipmentStatus(id: string, userId: string, status: ShipmentStatus): Promise<{
        items: ({
            inventoryItem: {
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
                product: {
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
                    deadline: Date | null;
                    requiresSewing: boolean | null;
                    upholsteryMaterial: string | null;
                    nomenclatureId: string | null;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                quantity: number;
                notes: string | null;
                productId: string | null;
                productTypeId: string;
                orderId: string | null;
                receivedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            shipmentId: string;
            inventoryItemId: string;
        })[];
        shippedBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.ShipmentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderNumber: string | null;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    }>;
    cancelShipment(id: string, userId: string): Promise<{
        status: import(".prisma/client").$Enums.ShipmentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        orderNumber: string | null;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    }>;
    getWaybillData(id: string): Promise<{
        shipmentId: string;
        shipmentDate: string;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: string;
        orderNumber: string;
        items: {
            name: string;
            quantity: number;
            productType: string;
            orderNumber: string;
        }[];
        shippedBy: string;
        notes: string;
    }>;
}
