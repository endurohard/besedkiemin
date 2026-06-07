import { DepartmentPresetsService } from "./department-presets.service";
import { CreateDepartmentPresetDto, UpdateDepartmentPresetDto } from "./dto";
export declare class DepartmentPresetsController {
    private readonly service;
    constructor(service: DepartmentPresetsService);
    findPublic(): Promise<{
        code: string;
        color: string;
        label: string;
        sortOrder: number;
    }[]>;
    findAll(): Promise<({
        user: {
            role: {
                name: string;
                code: string;
            };
            email: string;
            firstName: string;
            lastName: string;
            isActive: boolean;
            id: string;
        };
    } & {
        isActive: boolean;
        id: string;
        code: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        userId: string;
        sortOrder: number;
    })[]>;
    create(dto: CreateDepartmentPresetDto): Promise<{
        isActive: boolean;
        id: string;
        code: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        userId: string;
        sortOrder: number;
    }>;
    update(id: string, dto: UpdateDepartmentPresetDto): Promise<{
        isActive: boolean;
        id: string;
        code: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        userId: string;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
