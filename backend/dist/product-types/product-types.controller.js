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
exports.ProductTypesController = void 0;
const common_1 = require("@nestjs/common");
const product_types_service_1 = require("./product-types.service");
const create_product_type_dto_1 = require("./dto/create-product-type.dto");
const update_product_type_dto_1 = require("./dto/update-product-type.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let ProductTypesController = class ProductTypesController {
    constructor(productTypesService) {
        this.productTypesService = productTypesService;
    }
    create(createProductTypeDto) {
        return this.productTypesService.create(createProductTypeDto);
    }
    findAll(includeInactive) {
        return this.productTypesService.findAll(includeInactive === 'true');
    }
    findOne(id) {
        return this.productTypesService.findOne(id);
    }
    update(id, updateProductTypeDto) {
        return this.productTypesService.update(id, updateProductTypeDto);
    }
    toggleActive(id) {
        return this.productTypesService.toggleActive(id);
    }
    remove(id) {
        return this.productTypesService.remove(id);
    }
};
exports.ProductTypesController = ProductTypesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Создать новый тип продукта (только менеджер)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_type_dto_1.CreateProductTypeDto]),
    __metadata("design:returntype", void 0)
], ProductTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все типы продуктов' }),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить тип продукта по ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить тип продукта (только менеджер)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_type_dto_1.UpdateProductTypeDto]),
    __metadata("design:returntype", void 0)
], ProductTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/toggle-active'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Переключить активность типа продукта (только менеджер)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductTypesController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить тип продукта (только менеджер)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductTypesController.prototype, "remove", null);
exports.ProductTypesController = ProductTypesController = __decorate([
    (0, swagger_1.ApiTags)('product-types'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('product-types'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [product_types_service_1.ProductTypesService])
], ProductTypesController);
//# sourceMappingURL=product-types.controller.js.map