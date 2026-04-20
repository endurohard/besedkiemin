import { PrismaService } from "../prisma/prisma.service";
import { UpdateFeatureFlagDto } from "./dto/update-feature-flag.dto";
export declare class FeatureFlagsService {
    private prisma;
    constructor(prisma: PrismaService);
    initializeDefaults(): Promise<void>;
    findAll(): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        category: string;
        isEnabled: boolean;
    }[]>;
    findByKey(key: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        category: string;
        isEnabled: boolean;
    }>;
    isEnabled(key: string): Promise<boolean>;
    getEnabledFlags(): Promise<Record<string, boolean>>;
    update(key: string, updateDto: UpdateFeatureFlagDto): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        category: string;
        isEnabled: boolean;
    }>;
    toggle(key: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        category: string;
        isEnabled: boolean;
    }>;
    bulkUpdate(updates: {
        key: string;
        isEnabled: boolean;
    }[]): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        category: string;
        isEnabled: boolean;
    }[]>;
}
