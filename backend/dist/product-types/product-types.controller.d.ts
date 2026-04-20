import { ProductTypesService } from "./product-types.service";
import { CreateProductTypeDto } from "./dto/create-product-type.dto";
import { UpdateProductTypeDto } from "./dto/update-product-type.dto";
export declare class ProductTypesController {
    private readonly productTypesService;
    constructor(productTypesService: ProductTypesService);
    create(createProductTypeDto: CreateProductTypeDto): Promise<{
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiresSewing: boolean;
        productionTimeHours: number | null;
    }>;
    findAll(includeInactive?: string): Promise<{
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiresSewing: boolean;
        productionTimeHours: number | null;
    }[]>;
    findOne(id: string): Promise<{
        _count: {
            products: number;
        };
    } & {
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiresSewing: boolean;
        productionTimeHours: number | null;
    }>;
    update(id: string, updateProductTypeDto: UpdateProductTypeDto): Promise<{
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiresSewing: boolean;
        productionTimeHours: number | null;
    }>;
    toggleActive(id: string): Promise<{
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiresSewing: boolean;
        productionTimeHours: number | null;
    }>;
    remove(id: string): Promise<{
        name: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requiresSewing: boolean;
        productionTimeHours: number | null;
    }>;
}
