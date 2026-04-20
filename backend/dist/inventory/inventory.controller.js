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
const inventory_service_1 = require("./inventory.service");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    createInventoryItem(name, productTypeId, quantity, notes) {
        return this.inventoryService.createInventoryItem({
            name,
            productTypeId,
            quantity,
            notes,
        });
    }
    getAllInventory(productTypeId) {
        return this.inventoryService.getAllInventory({
            productTypeId,
        });
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
    getAvailability(productTypeId, name) {
        return this.inventoryService.getAvailability(productTypeId, name);
    }
    getInventoryItem(id) {
        return this.inventoryService.getInventoryItem(id);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("OWNER", "MANAGER"),
    (0, swagger_1.ApiOperation)({ summary: "Добавить товар на склад вручную" }),
    __param(0, (0, common_1.Body)("name")),
    __param(1, (0, common_1.Body)("productTypeId")),
    __param(2, (0, common_1.Body)("quantity")),
    __param(3, (0, common_1.Body)("notes")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createInventoryItem", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)("OWNER", "MANAGER", "WAREHOUSE"),
    (0, swagger_1.ApiOperation)({ summary: "Получить все складские остатки" }),
    (0, swagger_1.ApiQuery)({
        name: "productTypeId",
        required: false,
        type: String,
        description: "Фильтр по типу продукта",
    }),
    __param(0, (0, common_1.Query)("productTypeId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAllInventory", null);
__decorate([
    (0, common_1.Get)("summary"),
    (0, roles_decorator_1.Roles)("OWNER", "MANAGER", "WAREHOUSE"),
    (0, swagger_1.ApiOperation)({
        summary: "Получить сводку по остаткам (группировка по типам)",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventorySummary", null);
__decorate([
    (0, common_1.Get)("type/:productTypeId"),
    (0, roles_decorator_1.Roles)("OWNER", "MANAGER", "WAREHOUSE"),
    (0, swagger_1.ApiOperation)({ summary: "Получить остатки по типу продукта" }),
    __param(0, (0, common_1.Param)("productTypeId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventoryByType", null);
__decorate([
    (0, common_1.Get)("order/:orderId"),
    (0, roles_decorator_1.Roles)("OWNER", "MANAGER", "WAREHOUSE"),
    (0, swagger_1.ApiOperation)({ summary: "Получить остатки по заказу" }),
    __param(0, (0, common_1.Param)("orderId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventoryByOrder", null);
__decorate([
    (0, common_1.Get)("availability/lookup"),
    (0, roles_decorator_1.Roles)("OWNER", "MANAGER", "WAREHOUSE"),
    (0, swagger_1.ApiOperation)({
        summary: "Проверить доступное количество на складе по типу и названию",
    }),
    (0, swagger_1.ApiQuery)({ name: "productTypeId", required: true }),
    (0, swagger_1.ApiQuery)({ name: "name", required: true }),
    __param(0, (0, common_1.Query)("productTypeId")),
    __param(1, (0, common_1.Query)("name")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, roles_decorator_1.Roles)("OWNER", "MANAGER", "WAREHOUSE"),
    (0, swagger_1.ApiOperation)({ summary: "Получить детали складского остатка" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getInventoryItem", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)("Inventory"),
    (0, common_1.Controller)("inventory"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map