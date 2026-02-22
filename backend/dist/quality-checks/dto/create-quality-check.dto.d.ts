import { QualityStatus, ProductionStage } from '@prisma/client';
export declare class CreateQualityCheckDto {
    productId: string;
    status: QualityStatus;
    notes?: string;
    returnToStage?: ProductionStage;
}
