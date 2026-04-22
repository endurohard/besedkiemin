import { PrismaService } from "../prisma/prisma.service";
import { ShipmentStatus } from "@prisma/client";
import { NotificationsGateway } from "../notifications/notifications.gateway";
export declare class ShipmentsService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsGateway);
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
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
        status: import(".prisma/client").$Enums.ShipmentStatus;
        notes: string | null;
        orderNumber: string | null;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: Date | null;
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
                } | null;
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
                    schemaImageUrls: string[];
                    deadline: Date | null;
                    requiresSewing: boolean | null;
                    upholsteryMaterial: string | null;
                    isCustom: boolean;
                    stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
                    nomenclatureId: string | null;
                } | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
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
                } | null;
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
                    schemaImageUrls: string[];
                    deadline: Date | null;
                    requiresSewing: boolean | null;
                    upholsteryMaterial: string | null;
                    isCustom: boolean;
                    stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
                    nomenclatureId: string | null;
                } | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
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
                } | null;
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
                    schemaImageUrls: string[];
                    deadline: Date | null;
                    requiresSewing: boolean | null;
                    upholsteryMaterial: string | null;
                    isCustom: boolean;
                    stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
                    nomenclatureId: string | null;
                } | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
        notes: string | null;
        orderNumber: string | null;
        customerName: string;
        customerPhone: string;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    }>;
    cancelShipment(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ShipmentStatus;
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
        deliveryDate: string | undefined;
        orderNumber: string;
        items: {
            name: string;
            quantity: number;
            productType: string;
            orderNumber: string | undefined;
        }[];
        shippedBy: string;
        notes: string | null;
    }>;
}
