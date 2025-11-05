import { ShipmentStatus } from '@prisma/client';
import { ShipmentsService } from './shipments.service';
export declare class ShipmentsController {
    private readonly shipmentsService;
    constructor(shipmentsService: ShipmentsService);
    createShipment(items: Array<{
        inventoryItemId: string;
        quantity: number;
    }>, customerName: string, customerPhone: string, deliveryAddress: string, deliveryDate: Date, notes: string, req: any): Promise<{
        items: ({
            inventoryItem: {
                productType: {
                    description: string | null;
                    name: string;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    productionTimeHours: number | null;
                };
                product: {
                    description: string | null;
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    stage: import(".prisma/client").$Enums.ProductionStage;
                    quantity: number;
                    dimensions: string | null;
                    schemaImageUrl: string | null;
                    deadline: Date | null;
                    productTypeId: string;
                    orderId: string;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                productId: string;
                quantity: number;
                productTypeId: string;
                orderId: string;
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
        customerName: string;
        customerPhone: string;
        notes: string | null;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    }>;
    getAllShipments(req: any): Promise<({
        items: ({
            inventoryItem: {
                order: {
                    status: import(".prisma/client").$Enums.OrderStatus;
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    customerName: string;
                    customerPhone: string | null;
                    customerAddress: string | null;
                    notes: string | null;
                    priority: import(".prisma/client").$Enums.OrderPriority;
                    orderNumber: string;
                    createdById: string;
                };
                productType: {
                    description: string | null;
                    name: string;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    productionTimeHours: number | null;
                };
                product: {
                    description: string | null;
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    stage: import(".prisma/client").$Enums.ProductionStage;
                    quantity: number;
                    dimensions: string | null;
                    schemaImageUrl: string | null;
                    deadline: Date | null;
                    productTypeId: string;
                    orderId: string;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                productId: string;
                quantity: number;
                productTypeId: string;
                orderId: string;
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
        customerName: string;
        customerPhone: string;
        notes: string | null;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    })[]>;
    getShipmentsByStatus(status: ShipmentStatus, req: any): Promise<({
        items: ({
            inventoryItem: {
                order: {
                    status: import(".prisma/client").$Enums.OrderStatus;
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    customerName: string;
                    customerPhone: string | null;
                    customerAddress: string | null;
                    notes: string | null;
                    priority: import(".prisma/client").$Enums.OrderPriority;
                    orderNumber: string;
                    createdById: string;
                };
                productType: {
                    description: string | null;
                    name: string;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    productionTimeHours: number | null;
                };
                product: {
                    description: string | null;
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    stage: import(".prisma/client").$Enums.ProductionStage;
                    quantity: number;
                    dimensions: string | null;
                    schemaImageUrl: string | null;
                    deadline: Date | null;
                    productTypeId: string;
                    orderId: string;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                productId: string;
                quantity: number;
                productTypeId: string;
                orderId: string;
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
        customerName: string;
        customerPhone: string;
        notes: string | null;
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
                    customerName: string;
                    customerPhone: string | null;
                    customerAddress: string | null;
                    notes: string | null;
                    priority: import(".prisma/client").$Enums.OrderPriority;
                    orderNumber: string;
                    createdById: string;
                };
                productType: {
                    description: string | null;
                    name: string;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    productionTimeHours: number | null;
                };
                product: {
                    description: string | null;
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    stage: import(".prisma/client").$Enums.ProductionStage;
                    quantity: number;
                    dimensions: string | null;
                    schemaImageUrl: string | null;
                    deadline: Date | null;
                    productTypeId: string;
                    orderId: string;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                productId: string;
                quantity: number;
                productTypeId: string;
                orderId: string;
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
        customerName: string;
        customerPhone: string;
        notes: string | null;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    }>;
    updateShipmentStatus(id: string, status: ShipmentStatus, req: any): Promise<{
        items: ({
            inventoryItem: {
                order: {
                    status: import(".prisma/client").$Enums.OrderStatus;
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    customerName: string;
                    customerPhone: string | null;
                    customerAddress: string | null;
                    notes: string | null;
                    priority: import(".prisma/client").$Enums.OrderPriority;
                    orderNumber: string;
                    createdById: string;
                };
                productType: {
                    description: string | null;
                    name: string;
                    isActive: boolean;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    productionTimeHours: number | null;
                };
                product: {
                    description: string | null;
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    stage: import(".prisma/client").$Enums.ProductionStage;
                    quantity: number;
                    dimensions: string | null;
                    schemaImageUrl: string | null;
                    deadline: Date | null;
                    productTypeId: string;
                    orderId: string;
                };
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                productId: string;
                quantity: number;
                productTypeId: string;
                orderId: string;
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
        customerName: string;
        customerPhone: string;
        notes: string | null;
        deliveryAddress: string;
        deliveryDate: Date | null;
        shippedById: string;
    }>;
    cancelShipment(id: string, req: any): Promise<{
        status: import(".prisma/client").$Enums.ShipmentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerName: string;
        customerPhone: string;
        notes: string | null;
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
