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
exports.CatalogCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const catalog_categories_service_1 = require("./catalog-categories.service");
const create_catalog_category_dto_1 = require("./dto/create-catalog-category.dto");
const update_catalog_category_dto_1 = require("./dto/update-catalog-category.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let CatalogCategoriesController = class CatalogCategoriesController {
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    create(createDto) {
        return this.categoriesService.create(createDto);
    }
    findAll(includeInactive) {
        return this.categoriesService.findAll(includeInactive === "true");
    }
    findOne(id) {
        return this.categoriesService.findOne(id);
    }
    findBySlug(slug) {
        return this.categoriesService.findBySlug(slug);
    }
    update(id, updateDto) {
        return this.categoriesService.update(id, updateDto);
    }
    remove(id) {
        return this.categoriesService.remove(id);
    }
};
exports.CatalogCategoriesController = CatalogCategoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("catalog:manage"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Создать категорию (нужно право catalog:manage)" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_catalog_category_dto_1.CreateCatalogCategoryDto]),
    __metadata("design:returntype", void 0)
], CatalogCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Получить все категории (публичный доступ)" }),
    __param(0, (0, common_1.Query)("includeInactive")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Получить категорию по ID (публичный доступ)" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogCategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)("slug/:slug"),
    (0, swagger_1.ApiOperation)({ summary: "Получить категорию по slug (публичный доступ)" }),
    __param(0, (0, common_1.Param)("slug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogCategoriesController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("catalog:manage"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Обновить категорию (нужно право catalog:manage)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_catalog_category_dto_1.UpdateCatalogCategoryDto]),
    __metadata("design:returntype", void 0)
], CatalogCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("OWNER"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Удалить категорию (только OWNER)" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogCategoriesController.prototype, "remove", null);
exports.CatalogCategoriesController = CatalogCategoriesController = __decorate([
    (0, swagger_1.ApiTags)("Catalog Categories"),
    (0, common_1.Controller)("catalog-categories"),
    __metadata("design:paramtypes", [catalog_categories_service_1.CatalogCategoriesService])
], CatalogCategoriesController);
//# sourceMappingURL=catalog-categories.controller.js.map