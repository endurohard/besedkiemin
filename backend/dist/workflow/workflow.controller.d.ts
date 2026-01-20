import { WorkflowService } from './workflow.service';
import { CreateWorkflowStageDto } from './dto/create-workflow-stage.dto';
import { UpdateWorkflowStageDto } from './dto/update-workflow-stage.dto';
import { ReorderWorkflowStagesDto } from './dto/reorder-workflow-stages.dto';
export declare class WorkflowController {
    private readonly workflowService;
    constructor(workflowService: WorkflowService);
    findAll(): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }[]>;
    findActive(): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }[]>;
    findOne(id: string): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }>;
    create(createWorkflowStageDto: CreateWorkflowStageDto): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }>;
    update(id: string, updateWorkflowStageDto: UpdateWorkflowStageDto): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }>;
    reorder(reorderWorkflowStagesDto: ReorderWorkflowStagesDto): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }[]>;
    initializeDefaultWorkflow(): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }[]>;
    getNextStage(id: string): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }>;
    getPreviousStage(id: string): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
    }>;
}
