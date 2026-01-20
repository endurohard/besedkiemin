export declare class CreateRoleDto {
    name: string;
    code: string;
    description?: string;
    color?: string;
    isActive?: boolean;
    order?: number;
    permissions?: string[];
    workflowStageIds?: string[];
}
