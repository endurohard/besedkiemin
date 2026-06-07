import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto, UpdateRoleDto } from "./dto";
export declare class RolesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            users: number;
        };
        workflowStages: ({
            workflowStage: {
                description: string | null;
                order: number;
                name: string;
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
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        isSystem: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            users: number;
        };
        workflowStages: ({
            workflowStage: {
                description: string | null;
                order: number;
                name: string;
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
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        isSystem: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByCode(code: string): Promise<({
        workflowStages: ({
            workflowStage: {
                description: string | null;
                order: number;
                name: string;
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
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        code: string;
        color: string | null;
        isSystem: boolean;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    create(dto: CreateRoleDto): Promise<{
        _count: {
            users: number;
        };
        workflowStages: ({
            workflowStage: {
                description: string | null;
                order: number;
                name: string;
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
        description: string | null;
        order: number;
        name: string;
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
                description: string | null;
                order: number;
                name: string;
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
        description: string | null;
        order: number;
        name: string;
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
    getAllPermissions(): {
        code: string;
        name: string;
        group: string;
    }[];
}
