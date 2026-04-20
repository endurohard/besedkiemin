import { RolesService } from "./roles.service";
import { CreateRoleDto, UpdateRoleDto } from "./dto";
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(): Promise<({
        _count: {
            users: number;
        };
        workflowStages: ({
            workflowStage: {
                order: number;
                name: string;
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
            };
        } & {
            roleId: string;
            id: string;
            workflowStageId: string;
        })[];
    } & {
        order: number;
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        isSystem: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getAllPermissions(): {
        code: string;
        name: string;
        group: string;
    }[];
    findOne(id: string): Promise<{
        _count: {
            users: number;
        };
        workflowStages: ({
            workflowStage: {
                order: number;
                name: string;
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
            };
        } & {
            roleId: string;
            id: string;
            workflowStageId: string;
        })[];
    } & {
        order: number;
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        isSystem: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateRoleDto): Promise<{
        _count: {
            users: number;
        };
        workflowStages: ({
            workflowStage: {
                order: number;
                name: string;
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
            };
        } & {
            roleId: string;
            id: string;
            workflowStageId: string;
        })[];
    } & {
        order: number;
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        isSystem: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        _count: {
            users: number;
        };
        workflowStages: ({
            workflowStage: {
                order: number;
                name: string;
                description: string | null;
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                legacyStage: import(".prisma/client").$Enums.ProductionStage | null;
            };
        } & {
            roleId: string;
            id: string;
            workflowStageId: string;
        })[];
    } & {
        order: number;
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        isSystem: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
