export declare class CreateCatalogProductDto {
    name: string;
    slug: string;
    description?: string;
    shortDesc?: string;
    images?: string[];
    dimensions?: string;
    material?: string;
    price?: number;
    priceNote?: string;
    features?: any;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    order?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    categoryId: string;
}
