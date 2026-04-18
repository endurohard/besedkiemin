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
exports.CatalogOrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const catalog_orders_service_1 = require("./catalog-orders.service");
const create_catalog_order_dto_1 = require("./dto/create-catalog-order.dto");
const update_catalog_order_dto_1 = require("./dto/update-catalog-order.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const feature_flag_guard_1 = require("../feature-flags/guards/feature-flag.guard");
const feature_flag_decorator_1 = require("../feature-flags/decorators/feature-flag.decorator");
let CatalogOrdersController = class CatalogOrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    create(createDto) {
        return this.ordersService.create(createDto);
    }
    findAll(status, page, limit) {
        const parsedPage = page ? parseInt(page, 10) : undefined;
        const parsedLimit = limit ? parseInt(limit, 10) : undefined;
        return this.ordersService.findAll({
            status,
            page: parsedPage && !isNaN(parsedPage) ? parsedPage : undefined,
            limit: parsedLimit && !isNaN(parsedLimit) ? parsedLimit : undefined,
        });
    }
    findOne(id) {
        return this.ordersService.findOne(id);
    }
    update(id, updateDto) {
        return this.ordersService.update(id, updateDto);
    }
    remove(id) {
        return this.ordersService.remove(id);
    }
    markContacted(id, req) {
        return this.ordersService.markContacted(id, req.user.userId);
    }
    markProcessed(id, req) {
        return this.ordersService.markProcessed(id, req.user.userId);
    }
    cancelOrder(id, cancellationReason, req) {
        return this.ordersService.cancelOrder(id, cancellationReason, req.user.userId);
    }
};
exports.CatalogOrdersController = CatalogOrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: "Создать заказ (публичный доступ, rate limited)" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_catalog_order_dto_1.CreateCatalogOrderDto]),
    __metadata("design:returntype", void 0)
], CatalogOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, feature_flag_guard_1.FeatureFlagGuard),
    (0, roles_decorator_1.Roles)("SUPER_ADMIN", "OWNER", "MANAGER"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Получить все заказы (SUPER_ADMIN/OWNER/MANAGER)" }),
    (0, swagger_1.ApiQuery)({ name: "status", required: false }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    __param(0, (0, common_1.Query)("status")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CatalogOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, feature_flag_guard_1.FeatureFlagGuard),
    (0, roles_decorator_1.Roles)("SUPER_ADMIN", "OWNER", "MANAGER"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Получить заказ по ID (SUPER_ADMIN/OWNER/MANAGER)" }),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, feature_flag_guard_1.FeatureFlagGuard),
    (0, roles_decorator_1.Roles)("SUPER_ADMIN", "OWNER", "MANAGER"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Обновить заказ (SUPER_ADMIN/OWNER/MANAGER)" }),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_catalog_order_dto_1.UpdateCatalogOrderDto]),
    __metadata("design:returntype", void 0)
], CatalogOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, feature_flag_guard_1.FeatureFlagGuard),
    (0, roles_decorator_1.Roles)("SUPER_ADMIN", "OWNER"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Удалить заказ (SUPER_ADMIN/OWNER)" }),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogOrdersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/mark-contacted"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, feature_flag_guard_1.FeatureFlagGuard),
    (0, roles_decorator_1.Roles)("SUPER_ADMIN", "OWNER", "MANAGER"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Отметить "Связались с клиентом"' }),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CatalogOrdersController.prototype, "markContacted", null);
__decorate([
    (0, common_1.Post)(":id/mark-processed"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, feature_flag_guard_1.FeatureFlagGuard),
    (0, roles_decorator_1.Roles)("SUPER_ADMIN", "OWNER", "MANAGER"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Отметить "Оформили заказ" и создать производственный заказ',
    }),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CatalogOrdersController.prototype, "markProcessed", null);
__decorate([
    (0, common_1.Post)(":id/cancel"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, feature_flag_guard_1.FeatureFlagGuard),
    (0, roles_decorator_1.Roles)("SUPER_ADMIN", "OWNER", "MANAGER"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Отменить заказ с указанием причины" }),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)("cancellationReason")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CatalogOrdersController.prototype, "cancelOrder", null);
exports.CatalogOrdersController = CatalogOrdersController = __decorate([
    (0, swagger_1.ApiTags)("Catalog Orders"),
    (0, common_1.Controller)("catalog-orders"),
    (0, feature_flag_decorator_1.RequireFeature)("catalog_orders"),
    __metadata("design:paramtypes", [catalog_orders_service_1.CatalogOrdersService])
], CatalogOrdersController);
//# sourceMappingURL=catalog-orders.controller.js.map