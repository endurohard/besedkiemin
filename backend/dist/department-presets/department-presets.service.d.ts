import { PrismaService } from "../prisma/prisma.service";
import { CreateDepartmentPresetDto, UpdateDepartmentPresetDto } from "./dto";
export declare class DepartmentPresetsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findPublic(): Promise<{
        code: string;
        label: string;
        color: string;
        sortOrder: number;
    }[]>;
    findByCodeActive(code: string): Promise<({
        user: {
            role: {
                id: string;
                code: string;
                color: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isSystem: boolean;
                order: number;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            isDepartmentAccount: boolean;
            roleId: string;
            paymentType: import(".prisma/client").$Enums.PaymentType;
            monthlySalary: number | null;
            pin: string | null;
            pinLookup: string | null;
            telegramId: string | null;
            sipServer: string | null;
            sipUser: string | null;
            sipPassword: string | null;
            sipPort: number | null;
            sipWsPort: number | null;
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
    }) | null>;
    findOne(id: string): Promise<{
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
