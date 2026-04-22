import { InventoryService } from "./inventory.service";
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createInventoryItem(name: string, productTypeId: string, quantity: number, notes: string): Promise<{
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
        } | null;
        productType: {
            name: string;
            id: string;
        };
        product: {
            name: string;
            id: string;
            stage: import(".prisma/client").$Enums.ProductionStage;
        } | null;
        name: string;
        id: string;
        createdAt: Date;
        quantity: number;
        notes: string | null;
        receivedAt: Date;
    }[]>;
    getInventorySummary(): Promise<{
        productType: {
            name: string;
            id: string;
        } | undefined;
        totalQuantity: number;
        itemCount: number;
    }[]>;
    getInventoryByType(productTypeId: string): Promise<({
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
    })[]>;
    getInventoryByOrder(orderId: string): Promise<({
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
    })[]>;
    getAvailability(productTypeId: string, name: string): Promise<{
        quantity: number;
    }>;
    getInventoryItem(id: string): Promise<({
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
        shipmentItems: ({
            shipment: {
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
    }) | null>;
}
