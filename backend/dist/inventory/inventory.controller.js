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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const inventory_service_1 = require("./inventory.service");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    getAllInventory() {
        return this.inventoryService.getAllInventory();
    }
    getInventorySummary() {
        return this.inventoryService.getInventorySummary();
    }
    getInventoryByType(productTypeId) {
        return this.inventoryService.getInventoryByType(productTypeId);
    }
    getInventoryByOrder(orderId) {
        return this.inventoryService.getInventoryByOrder(orderId);
    }
    getInventoryItem(id) {
        return this.inventoryService.getInventoryItem(id);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все складские остатки' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAllInventory", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить сводку по остаткам (группировка по типам)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventorySummary", null);
__decorate([
    (0, common_1.Get)('type/:productTypeId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить остатки по типу продукта' }),
    __param(0, (0, common_1.Param)('productTypeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventoryByType", null);
__decorate([
    (0, common_1.Get)('order/:orderId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить остатки по заказу' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventoryByOrder", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить детали складского остатка' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventoryItem", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map