import { ProductionStage } from "@prisma/client";
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
    isCustom?: boolean;
    assignedWorkerId?: string;
    stageAssignments?: Record<string, string>;
    startStage?: ProductionStage;
}
