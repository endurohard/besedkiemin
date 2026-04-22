import { DepartmentPresetsService } from "./department-presets.service";
import { CreateDepartmentPresetDto, UpdateDepartmentPresetDto } from "./dto";
export declare class DepartmentPresetsController {
    private readonly service;
    constructor(service: DepartmentPresetsService);
    findPublic(): Promise<{
        code: string;
        label: string;
        color: string;
        sortOrder: number;
    }[]>;
    findAll(): Promise<({
        user: {
            id: string;
            isActive: boolean;
            email: string;
            firstName: string;
            lastName: string;
            role: {
                code: string;
                name: string;
            };
        };
    } & {
        id: string;
        code: string;
        label: string;
        userId: string;
        color: string;
        sortOrder: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    create(dto: CreateDepartmentPresetDto): Promise<{
        id: string;
        code: string;
        label: string;
        userId: string;
        color: string;
        sortOrder: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateDepartmentPresetDto): Promise<{
        id: string;
        code: string;
        label: string;
        userId: string;
        color: string;
        sortOrder: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
