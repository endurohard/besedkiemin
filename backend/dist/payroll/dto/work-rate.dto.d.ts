import { ProductionStage } from '@prisma/client';
export declare class CreateWorkRateDto {
    productTypeId: string;
    stage: ProductionStage;
    workflowStageId?: string;
    pricePerUnit: number;
    description?: string;
    isActive?: boolean;
}
export declare class UpdateWorkRateDto {
    pricePerUnit?: number;
    description?: string;
    isActive?: boolean;
}
