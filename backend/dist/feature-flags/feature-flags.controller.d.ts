import { FeatureFlagsService } from './feature-flags.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
export declare class FeatureFlagsController {
    private readonly featureFlagsService;
    constructor(featureFlagsService: FeatureFlagsService);
    getPublicFlags(): Promise<Record<string, boolean>>;
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
