import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getAllInventory(): Promise<({
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
    })[]>;
    getInventorySummary(): Promise<unknown[]>;
    getInventoryByType(productTypeId: string): Promise<({
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
    })[]>;
    getInventoryByOrder(orderId: string): Promise<({
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
    })[]>;
    getInventoryItem(id: string): Promise<{
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
        shipmentItems: ({
            shipment: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            shipmentId: string;
            inventoryItemId: string;
        })[];
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
    }>;
}
