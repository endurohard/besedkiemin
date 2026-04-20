import { FeatureFlagsService } from "./feature-flags.service";
import { UpdateFeatureFlagDto } from "./dto/update-feature-flag.dto";
export declare class FeatureFlagsController {
    private readonly featureFlagsService;
    constructor(featureFlagsService: FeatureFlagsService);
    getPublicFlags(): Promise<Record<string, boolean>>;
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
