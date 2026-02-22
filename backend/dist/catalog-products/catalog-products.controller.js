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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const catalog_products_service_1 = require("./catalog-products.service");
const create_catalog_product_dto_1 = require("./dto/create-catalog-product.dto");
const update_catalog_product_dto_1 = require("./dto/update-catalog-product.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let CatalogProductsController = class CatalogProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    create(createDto) {
        return this.productsService.create(createDto);
    }
    findAll(categoryId, isFeatured, includeInactive) {
        return this.productsService.findAll({
            categoryId,
            isFeatured: isFeatured === 'true',
            includeInactive: includeInactive === 'true',
        });
    }
    getFeatured(limit) {
        const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        return this.productsService.getFeatured(parsedLimit && !isNaN(parsedLimit) ? parsedLimit : undefined);
    }
    findOne(id) {
        return this.productsService.findOne(id);
    }
    findBySlug(slug) {
        return this.productsService.findBySlug(slug);
    }
    update(id, updateDto) {
        return this.productsService.update(id, updateDto);
    }
    remove(id) {
        return this.productsService.remove(id);
    }
};
exports.CatalogProductsController = CatalogProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('OWNER', 'MANAGER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать товар (только OWNER/MANAGER)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_catalog_product_dto_1.CreateCatalogProductDto]),
    __metadata("design:returntype", void 0)
], CatalogProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все товары (публичный доступ)' }),
    __param(0, (0, common_1.Query)('categoryId')),
    __param(1, (0, common_1.Query)('isFeatured')),
    __param(2, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CatalogProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('featured'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить рекомендуемые товары (публичный доступ)' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogProductsController.prototype, "getFeatured", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить товар по ID (публичный доступ)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить товар по slug (публичный доступ)' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogProductsController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('OWNER', 'MANAGER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить товар (только OWNER/MANAGER)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_catalog_product_dto_1.UpdateCatalogProductDto]),
    __metadata("design:returntype", void 0)
], CatalogProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('OWNER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить товар (только OWNER)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogProductsController.prototype, "remove", null);
exports.CatalogProductsController = CatalogProductsController = __decorate([
    (0, swagger_1.ApiTags)('Catalog Products'),
    (0, common_1.Controller)('catalog-products'),
    __metadata("design:paramtypes", [catalog_products_service_1.CatalogProductsService])
], CatalogProductsController);
//# sourceMappingURL=catalog-products.controller.js.map