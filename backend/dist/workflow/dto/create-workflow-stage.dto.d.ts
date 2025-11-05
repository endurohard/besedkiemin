import { UserRole, ProductionStage } from '@prisma/client';
export declare class CreateWorkflowStageDto {
    name: string;
    description?: string;
    order: number;
    role: UserRole;
    legacyStage?: ProductionStage;
    isActive?: boolean;
}
