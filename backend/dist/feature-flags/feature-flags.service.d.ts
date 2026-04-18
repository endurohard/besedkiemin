import { PrismaService } from '../prisma/prisma.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
export declare class FeatureFlagsService {
    private prisma;
    constructor(prisma: PrismaService);
    initializeDefaults(): Promise<void>;
    findAll(): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        category: string;
        isEnabled: boolean;
    }[]>;
    findByKey(key: string): Promise<{
        description: string | null;
        name: string;
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
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        category: string;
        isEnabled: boolean;
    }>;
    toggle(key: string): Promise<{
        description: string | null;
        name: string;
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
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        category: string;
        isEnabled: boolean;
    }[]>;
}
