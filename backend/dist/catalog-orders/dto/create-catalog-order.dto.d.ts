export declare class OrderItemDto {
    productId: string;
    quantity?: number;
    comment?: string;
}
export declare class CreateCatalogOrderDto {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    comment?: string;
    deliveryAddress?: string;
    items: OrderItemDto[];
}
