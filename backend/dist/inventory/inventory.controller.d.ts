import { InventoryService } from "./inventory.service";
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createInventoryItem(name: string, productTypeId: string, quantity: number, notes: string): Promise<{
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            productionTimeHours: number | null;
            requiresSewing: boolean;
        };
    } & {
        id: string;
        name: string;
        quantity: number;
        receivedAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        productTypeId: string;
        orderId: string | null;
    }>;
    getAllInventory(productTypeId?: string): Promise<{
        id: string;
        name: string;
        quantity: number;
        receivedAt: Date;
        notes: string | null;
        createdAt: Date;
        product: {
            id: string;
            name: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
        } | null;
        productType: {
            id: string;
            name: string;
        };
        order: {
            id: string;
            orderNumber: string;
            customerName: string;
        } | null;
    }[]>;
    getInventorySummary(): Promise<{
        productType: {
            id: string;
            name: string;
        } | undefined;
        totalQuantity: number;
        itemCount: number;
    }[]>;
    getInventoryByType(productTypeId: string): Promise<({
        product: {
            id: string;
            name: string;
            quantity: number;
            createdAt: Date;
            updatedAt: Date;
            productTypeId: string;
            orderId: string;
            description: string | null;
            requiresSewing: boolean | null;
            dimensions: string | null;
            schemaImageUrl: string | null;
            stage: import(".prisma/client").$Enums.ProductionStage;
            deadline: Date | null;
            color: string | null;
            upholsteryMaterial: string | null;
            isCustom: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        } | null;
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            productionTimeHours: number | null;
            requiresSewing: boolean;
        };
        order: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            customerAddress: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            priority: import(".prisma/client").$Enums.OrderPriority;
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        } | null;
    } & {
        id: string;
        name: string;
        quantity: number;
        receivedAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        productTypeId: string;
        orderId: string | null;
    })[]>;
    getInventoryByOrder(orderId: string): Promise<({
        product: {
            id: string;
            name: string;
            quantity: number;
            createdAt: Date;
            updatedAt: Date;
            productTypeId: string;
            orderId: string;
            description: string | null;
            requiresSewing: boolean | null;
            dimensions: string | null;
            schemaImageUrl: string | null;
            stage: import(".prisma/client").$Enums.ProductionStage;
            deadline: Date | null;
            color: string | null;
            upholsteryMaterial: string | null;
            isCustom: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        } | null;
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            productionTimeHours: number | null;
            requiresSewing: boolean;
        };
        order: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            customerAddress: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            priority: import(".prisma/client").$Enums.OrderPriority;
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        } | null;
    } & {
        id: string;
        name: string;
        quantity: number;
        receivedAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        productTypeId: string;
        orderId: string | null;
    })[]>;
    getAvailability(productTypeId: string, name: string): Promise<{
        quantity: number;
    }>;
    getInventoryItem(id: string): Promise<({
        product: {
            id: string;
            name: string;
            quantity: number;
            createdAt: Date;
            updatedAt: Date;
            productTypeId: string;
            orderId: string;
            description: string | null;
            requiresSewing: boolean | null;
            dimensions: string | null;
            schemaImageUrl: string | null;
            stage: import(".prisma/client").$Enums.ProductionStage;
            deadline: Date | null;
            color: string | null;
            upholsteryMaterial: string | null;
            isCustom: boolean;
            stageAssignments: import("@prisma/client/runtime/library").JsonValue | null;
            nomenclatureId: string | null;
        } | null;
        productType: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            productionTimeHours: number | null;
            requiresSewing: boolean;
        };
        order: {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            orderNumber: string;
            customerName: string;
            customerPhone: string | null;
            customerAddress: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            priority: import(".prisma/client").$Enums.OrderPriority;
            sourceId: string | null;
            totalAmount: number | null;
            createdById: string;
        } | null;
        shipmentItems: ({
            shipment: {
                shippedBy: {
                    id: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                orderNumber: string | null;
                customerName: string;
                customerPhone: string;
                status: import(".prisma/client").$Enums.ShipmentStatus;
                deliveryAddress: string;
                deliveryDate: Date | null;
                shippedById: string;
            };
        } & {
            id: string;
            quantity: number;
            createdAt: Date;
            updatedAt: Date;
            shipmentId: string;
            inventoryItemId: string;
        })[];
    } & {
        id: string;
        name: string;
        quantity: number;
        receivedAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        productTypeId: string;
        orderId: string | null;
    }) | null>;
}
