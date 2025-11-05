import { CatalogOrderStatus } from '@prisma/client';
export declare class UpdateCatalogOrderDto {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    deliveryAddress?: string;
    comment?: string;
    cancellationReason?: string;
    status?: CatalogOrderStatus;
}
