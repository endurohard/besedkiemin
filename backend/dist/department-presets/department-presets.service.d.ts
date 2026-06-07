import { PrismaService } from "../prisma/prisma.service";
import { CreateDepartmentPresetDto, UpdateDepartmentPresetDto } from "./dto";
export declare class DepartmentPresetsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findPublic(): Promise<{
        code: string;
        color: string;
        label: string;
        sortOrder: number;
    }[]>;
    findByCodeActive(code: string): Promise<({
        user: {
            role: {
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
            };
        } & {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            roleId: string;
            sipServer: string | null;
            sipUser: string | null;
            sipPassword: string | null;
            sipPort: number | null;
            paymentType: import(".prisma/client").$Enums.PaymentType;
            monthlySalary: number | null;
            isActive: boolean;
            telegramId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sipWsPort: number | null;
            adminPassword: string | null;
            isDepartmentAccount: boolean;
            pin: string | null;
            pinLookup: string | null;
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
    }) | null>;
    findOne(id: string): Promise<{
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
