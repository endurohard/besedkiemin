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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    create(createProductDto) {
        return this.productsService.create(createProductDto);
    }
    findAll(orderId, stage) {
        return this.productsService.findAll({ orderId, stage });
    }
    getByStage(stage) {
        return this.productsService.getProductsByStage(stage);
    }
    findOne(id) {
        return this.productsService.findOne(id);
    }
    getHistory(id) {
        return this.productsService.getProductHistory(id);
    }
    update(id, updateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }
    moveToStage(id, body, req) {
        return this.productsService.moveToStage(id, body.stage, req.user.userId, body.notes);
    }
    remove(id) {
        return this.productsService.remove(id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать новый продукт (только менеджер)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все продукты с фильтрами' }),
    (0, swagger_1.ApiQuery)({ name: 'orderId', required: false, description: 'Фильтр по ID заказа' }),
    (0, swagger_1.ApiQuery)({ name: 'stage', required: false, enum: client_1.ProductionStage, description: 'Фильтр по этапу' }),
    __param(0, (0, common_1.Query)('orderId')),
    __param(1, (0, common_1.Query)('stage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stage/:stage'),
    (0, roles_decorator_1.Roles)('MANAGER', 'OWNER', 'SUPER_ADMIN', 'WAREHOUSE'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить продукты на определенном этапе' }),
    __param(0, (0, common_1.Param)('stage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getByStage", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить продукт по ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, roles_decorator_1.Roles)('MANAGER', 'OWNER', 'SUPER_ADMIN', 'WAREHOUSE'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить историю прохождения продукта по этапам' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить продукт (только менеджер)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/move'),
    (0, swagger_1.ApiOperation)({ summary: 'Переместить продукт на следующий этап' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "moveToStage", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('MANAGER'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить продукт (только менеджер)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiTags)('products'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map