import { OrderPriority } from '@prisma/client';
export declare class CreateOrderDto {
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    description?: string;
    notes?: string;
    priority?: OrderPriority;
}
