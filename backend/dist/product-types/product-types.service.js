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
exports.ProductTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductTypesService = class ProductTypesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createProductTypeDto) {
        const existing = await this.prisma.productType.findUnique({
            where: { name: createProductTypeDto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Тип продукта с таким названием уже существует');
        }
        return this.prisma.productType.create({
            data: createProductTypeDto,
        });
    }
    async findAll(includeInactive = false) {
        return this.prisma.productType.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const productType = await this.prisma.productType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        if (!productType) {
            throw new common_1.NotFoundException('Тип продукта не найден');
        }
        return productType;
    }
    async update(id, updateProductTypeDto) {
        await this.findOne(id);
        if (updateProductTypeDto.name) {
            const existing = await this.prisma.productType.findUnique({
                where: { name: updateProductTypeDto.name },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException('Тип продукта с таким названием уже существует');
            }
        }
        return this.prisma.productType.update({
            where: { id },
            data: updateProductTypeDto,
        });
    }
    async remove(id) {
        const productType = await this.findOne(id);
        const productsCount = await this.prisma.product.count({
            where: { productTypeId: id },
        });
        if (productsCount > 0) {
            throw new common_1.ConflictException(`Невозможно удалить тип продукта. Существует ${productsCount} продуктов с этим типом`);
        }
        return this.prisma.productType.delete({
            where: { id },
        });
    }
    async toggleActive(id) {
        const productType = await this.findOne(id);
        return this.prisma.productType.update({
            where: { id },
            data: { isActive: !productType.isActive },
        });
    }
};
exports.ProductTypesService = ProductTypesService;
exports.ProductTypesService = ProductTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductTypesService);
//# sourceMappingURL=product-types.service.js.map