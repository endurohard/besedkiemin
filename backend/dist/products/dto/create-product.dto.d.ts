export declare class CreateProductDto {
    name: string;
    productTypeId: string;
    description?: string;
    quantity: number;
    dimensions?: string;
    schemaImageUrl?: string;
    orderId: string;
    deadline?: Date;
    requiresSewing?: boolean | null;
    color?: string;
    upholsteryMaterial?: string;
    nomenclatureId?: string;
    assignedWorkerId?: string;
    stageAssignments?: Record<string, string>;
}
