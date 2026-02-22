import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createInventoryItem(name: string, productTypeId: string, quantity: number, notes: string): Promise<{
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
    }>;
    getAllInventory(productTypeId?: string): Promise<{
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
        };
        productType: {
            name: string;
            id: string;
        };
        product: {
            name: string;
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
        };
        name: string;
        id: string;
        createdAt: Date;
        quantity: number;
        notes: string;
        receivedAt: Date;
    }[]>;
    getInventorySummary(): Promise<{
        productType: {
            name: string;
            id: string;
        };
        totalQuantity: number;
        itemCount: number;
    }[]>;
    getInventoryByType(productTypeId: string): Promise<({
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
    })[]>;
    getInventoryByOrder(orderId: string): Promise<({
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
    })[]>;
    getInventoryItem(id: string): Promise<{
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
                notes: string | null;
                orderNumber: string | null;
                customerName: string;
                customerPhone: string;
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
        quantity: number;
        notes: string | null;
        productId: string | null;
        productTypeId: string;
        orderId: string | null;
        receivedAt: Date;
    }>;
}
