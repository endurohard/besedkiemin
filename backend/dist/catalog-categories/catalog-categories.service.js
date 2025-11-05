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
exports.CatalogCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CatalogCategoriesService = class CatalogCategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto) {
        const existing = await this.prisma.catalogCategory.findUnique({
            where: { slug: createDto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException(`Категория с slug "${createDto.slug}" уже существует`);
        }
        return this.prisma.catalogCategory.create({
            data: {
                name: createDto.name,
                slug: createDto.slug,
                description: createDto.description,
                imageUrl: createDto.imageUrl,
                order: createDto.order ?? 0,
                isActive: createDto.isActive ?? true,
            },
        });
    }
    async findAll(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };
        return this.prisma.catalogCategory.findMany({
            where,
            orderBy: { order: 'asc' },
            include: {
                products: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                    take: 10,
                },
            },
        });
    }
    async findOne(id) {
        const category = await this.prisma.catalogCategory.findUnique({
            where: { id },
            include: {
                products: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Категория с ID ${id} не найдена`);
        }
        return category;
    }
    async findBySlug(slug) {
        const category = await this.prisma.catalogCategory.findUnique({
            where: { slug },
            include: {
                products: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Категория с slug "${slug}" не найдена`);
        }
        return category;
    }
    async update(id, updateDto) {
        await this.findOne(id);
        if (updateDto.slug) {
            const existing = await this.prisma.catalogCategory.findUnique({
                where: { slug: updateDto.slug },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Категория с slug "${updateDto.slug}" уже существует`);
            }
        }
        return this.prisma.catalogCategory.update({
            where: { id },
            data: updateDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        const productsCount = await this.prisma.catalogProduct.count({
            where: { categoryId: id },
        });
        if (productsCount > 0) {
            throw new common_1.ConflictException(`Невозможно удалить категорию: в ней ${productsCount} товар(ов)`);
        }
        return this.prisma.catalogCategory.delete({
            where: { id },
        });
    }
};
exports.CatalogCategoriesService = CatalogCategoriesService;
exports.CatalogCategoriesService = CatalogCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogCategoriesService);
//# sourceMappingURL=catalog-categories.service.js.map