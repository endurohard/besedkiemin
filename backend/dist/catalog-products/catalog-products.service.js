"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CatalogProductsService = class CatalogProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto) {
        const existing = await this.prisma.catalogProduct.findUnique({
            where: { slug: createDto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException(`Товар с slug "${createDto.slug}" уже существует`);
        }
        const category = await this.prisma.catalogCategory.findUnique({
            where: { id: createDto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Категория с ID ${createDto.categoryId} не найдена`);
        }
        return this.prisma.catalogProduct.create({
            data: {
                name: createDto.name,
                slug: createDto.slug,
                description: createDto.description,
                shortDesc: createDto.shortDesc,
                images: createDto.images || [],
                dimensions: createDto.dimensions,
                material: createDto.material,
                price: createDto.price,
                priceNote: createDto.priceNote,
                features: createDto.features,
                metaTitle: createDto.metaTitle,
                metaDescription: createDto.metaDescription,
                metaKeywords: createDto.metaKeywords,
                order: createDto.order ?? 0,
                isActive: createDto.isActive ?? true,
                isFeatured: createDto.isFeatured ?? false,
                categoryId: createDto.categoryId,
            },
            include: {
                category: true,
            },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters?.isFeatured !== undefined) {
            where.isFeatured = filters.isFeatured;
        }
        if (!filters?.includeInactive) {
            where.isActive = true;
        }
        return this.prisma.catalogProduct.findMany({
            where,
            orderBy: { order: "asc" },
            include: {
                category: true,
            },
        });
    }
    async findOne(id) {
        const product = await this.prisma.catalogProduct.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Товар с ID ${id} не найден`);
        }
        return product;
    }
    async findBySlug(slug) {
        const product = await this.prisma.catalogProduct.findUnique({
            where: { slug },
            include: {
                category: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Товар с slug "${slug}" не найден`);
        }
        return product;
    }
    async update(id, updateDto) {
        await this.findOne(id);
        if (updateDto.slug) {
            const existing = await this.prisma.catalogProduct.findUnique({
                where: { slug: updateDto.slug },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Товар с slug "${updateDto.slug}" уже существует`);
            }
        }
        if (updateDto.categoryId) {
            const category = await this.prisma.catalogCategory.findUnique({
                where: { id: updateDto.categoryId },
            });
            if (!category) {
                throw new common_1.NotFoundException(`Категория с ID ${updateDto.categoryId} не найдена`);
            }
        }
        return this.prisma.catalogProduct.update({
            where: { id },
            data: updateDto,
            include: {
                category: true,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.catalogProduct.delete({
            where: { id },
        });
    }
    async getFeatured(limit = 10) {
        return this.prisma.catalogProduct.findMany({
            where: {
                isActive: true,
                isFeatured: true,
            },
            orderBy: { order: "asc" },
            take: limit,
            include: {
                category: true,
            },
        });
    }
};
exports.CatalogProductsService = CatalogProductsService;
exports.CatalogProductsService = CatalogProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogProductsService);
//# sourceMappingURL=catalog-products.service.js.map