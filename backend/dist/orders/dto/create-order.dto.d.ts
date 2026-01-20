import { OrderPriority } from '@prisma/client';
export declare class CreateOrderDto {
    orderNumber?: string;
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    description?: string;
    notes?: string;
    priority?: OrderPriority;
    sourceId?: string;
    totalAmount?: number;
}
