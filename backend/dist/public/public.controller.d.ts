import { PrismaService } from "../prisma/prisma.service";
export declare class PublicController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOrderStatus(orderNumber: string): Promise<{
        orderNumber: string;
        customerName: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        statusText: string;
        statusEmoji: string;
        detailedStatus: string;
        createdAt: Date;
        products: {
            name: string;
            typeName: string;
            quantity: number;
            stage: import(".prisma/client").$Enums.ProductionStage;
        }[];
    }>;
}
