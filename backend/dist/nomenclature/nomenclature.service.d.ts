import { PrismaService } from "../prisma/prisma.service";
import { CreateNomenclatureDto } from "./dto/create-nomenclature.dto";
import { UpdateNomenclatureDto } from "./dto/update-nomenclature.dto";
export declare class NomenclatureService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateNomenclatureDto): Promise<{
        productType: {
            name: string;
            description: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
    } & {
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        upholsteryMaterial: string | null;
        productionTimeHours: number | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        costPrice: number | null;
        retailPrice: number | null;
        discontinuedAt: Date | null;
    }>;
    findAll(includeInactive?: boolean): Promise<({
        productType: {
            name: string;
            description: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
    } & {
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        upholsteryMaterial: string | null;
        productionTimeHours: number | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        costPrice: number | null;
        retailPrice: number | null;
        discontinuedAt: Date | null;
    })[]>;
    findByProductType(productTypeId: string, includeInactive?: boolean): Promise<({
        productType: {
            name: string;
            description: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
    } & {
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        upholsteryMaterial: string | null;
        productionTimeHours: number | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        costPrice: number | null;
        retailPrice: number | null;
        discontinuedAt: Date | null;
    })[]>;
    findOne(id: string): Promise<{
        productType: {
            name: string;
            description: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
    } & {
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        upholsteryMaterial: string | null;
        productionTimeHours: number | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        costPrice: number | null;
        retailPrice: number | null;
        discontinuedAt: Date | null;
    }>;
    update(id: string, updateDto: UpdateNomenclatureDto): Promise<{
        productType: {
            name: string;
            description: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
    } & {
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        upholsteryMaterial: string | null;
        productionTimeHours: number | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        costPrice: number | null;
        retailPrice: number | null;
        discontinuedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        upholsteryMaterial: string | null;
        productionTimeHours: number | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        costPrice: number | null;
        retailPrice: number | null;
        discontinuedAt: Date | null;
    }>;
    toggleActive(id: string): Promise<{
        productType: {
            name: string;
            description: string | null;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            requiresSewing: boolean;
            productionTimeHours: number | null;
        };
    } & {
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        color: string | null;
        createdAt: Date;
        updatedAt: Date;
        productTypeId: string;
        dimensions: string | null;
        upholsteryMaterial: string | null;
        productionTimeHours: number | null;
        sku: string | null;
        materials: string | null;
        weight: number | null;
        costPrice: number | null;
        retailPrice: number | null;
        discontinuedAt: Date | null;
    }>;
}
