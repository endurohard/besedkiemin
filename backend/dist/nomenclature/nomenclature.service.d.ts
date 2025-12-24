import { PrismaService } from '../prisma/prisma.service';
import { CreateNomenclatureDto } from './dto/create-nomenclature.dto';
import { UpdateNomenclatureDto } from './dto/update-nomenclature.dto';
export declare class NomenclatureService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateNomenclatureDto): Promise<{
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productionTimeHours: number | null;
        };
    } & {
        description: string | null;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        productionTimeHours: number | null;
        color: string | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        basePrice: number | null;
    }>;
    findAll(includeInactive?: boolean): Promise<({
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productionTimeHours: number | null;
        };
    } & {
        description: string | null;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        productionTimeHours: number | null;
        color: string | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        basePrice: number | null;
    })[]>;
    findByProductType(productTypeId: string, includeInactive?: boolean): Promise<({
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productionTimeHours: number | null;
        };
    } & {
        description: string | null;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        productionTimeHours: number | null;
        color: string | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        basePrice: number | null;
    })[]>;
    findOne(id: string): Promise<{
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productionTimeHours: number | null;
        };
    } & {
        description: string | null;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        productionTimeHours: number | null;
        color: string | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        basePrice: number | null;
    }>;
    update(id: string, updateDto: UpdateNomenclatureDto): Promise<{
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productionTimeHours: number | null;
        };
    } & {
        description: string | null;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        productionTimeHours: number | null;
        color: string | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        basePrice: number | null;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        productionTimeHours: number | null;
        color: string | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        basePrice: number | null;
    }>;
    toggleActive(id: string): Promise<{
        productType: {
            description: string | null;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productionTimeHours: number | null;
        };
    } & {
        description: string | null;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        productionTimeHours: number | null;
        color: string | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        basePrice: number | null;
    }>;
}
