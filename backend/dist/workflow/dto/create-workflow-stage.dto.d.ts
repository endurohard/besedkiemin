import { ProductionStage } from "@prisma/client";
export declare class CreateWorkflowStageDto {
    name: string;
    description?: string;
    order: number;
    roleIds?: string[];
    legacyStage?: ProductionStage;
    isActive?: boolean;
}
