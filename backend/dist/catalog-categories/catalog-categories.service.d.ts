import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogCategoryDto } from './dto/create-catalog-category.dto';
import { UpdateCatalogCategoryDto } from './dto/update-catalog-category.dto';
export declare class CatalogCategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateCatalogCategoryDto): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        imageUrl: string | null;
    }>;
    findAll(includeInactive?: boolean): Promise<({
        products: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dimensions: string | null;
            slug: string;
            shortDesc: string | null;
            images: string[];
            material: string | null;
            price: number | null;
            priceNote: string | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            metaTitle: string | null;
            metaDescription: string | null;
            metaKeywords: string | null;
            isFeatured: boolean;
            categoryId: string;
        }[];
    } & {
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        imageUrl: string | null;
    })[]>;
    findOne(id: string): Promise<{
        products: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dimensions: string | null;
            slug: string;
            shortDesc: string | null;
            images: string[];
            material: string | null;
            price: number | null;
            priceNote: string | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            metaTitle: string | null;
            metaDescription: string | null;
            metaKeywords: string | null;
            isFeatured: boolean;
            categoryId: string;
        }[];
    } & {
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        imageUrl: string | null;
    }>;
    findBySlug(slug: string): Promise<{
        products: {
            description: string | null;
            order: number;
            name: string;
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dimensions: string | null;
            slug: string;
            shortDesc: string | null;
            images: string[];
            material: string | null;
            price: number | null;
            priceNote: string | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            metaTitle: string | null;
            metaDescription: string | null;
            metaKeywords: string | null;
            isFeatured: boolean;
            categoryId: string;
        }[];
    } & {
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        imageUrl: string | null;
    }>;
    update(id: string, updateDto: UpdateCatalogCategoryDto): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        imageUrl: string | null;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        order: number;
        name: string;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        imageUrl: string | null;
    }>;
}
