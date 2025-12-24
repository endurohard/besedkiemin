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
exports.ShipmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const shipments_service_1 = require("./shipments.service");
let ShipmentsController = class ShipmentsController {
    constructor(shipmentsService) {
        this.shipmentsService = shipmentsService;
    }
    async createShipment(items, customerName, customerPhone, deliveryAddress, deliveryDate, notes, orderNumber, req) {
        return this.shipmentsService.createShipment(req.user.userId, {
            items,
            customerName,
            customerPhone,
            deliveryAddress,
            deliveryDate,
            notes,
            orderNumber,
        });
    }
    getAllShipments(req, status) {
        return this.shipmentsService.getAllShipments(req.user.userId, {
            status,
        });
    }
    getShipmentsByStatus(status, req) {
        return this.shipmentsService.getShipmentsByStatus(req.user.userId, status);
    }
    getShipment(id) {
        return this.shipmentsService.getShipment(id);
    }
    updateShipmentStatus(id, status, req) {
        return this.shipmentsService.updateShipmentStatus(id, req.user.userId, status);
    }
    cancelShipment(id, req) {
        return this.shipmentsService.cancelShipment(id, req.user.userId);
    }
    getWaybillData(id) {
        return this.shipmentsService.getWaybillData(id);
    }
};
exports.ShipmentsController = ShipmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Создать отгрузку (списать товары со склада)' }),
    __param(0, (0, common_1.Body)('items')),
    __param(1, (0, common_1.Body)('customerName')),
    __param(2, (0, common_1.Body)('customerPhone')),
    __param(3, (0, common_1.Body)('deliveryAddress')),
    __param(4, (0, common_1.Body)('deliveryDate')),
    __param(5, (0, common_1.Body)('notes')),
    __param(6, (0, common_1.Body)('orderNumber')),
    __param(7, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String, String, Date, String, String, Object]),
    __metadata("design:returntype", Promise)
], ShipmentsController.prototype, "createShipment", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все отгрузки с пагинацией' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.ShipmentStatus, description: 'Фильтр по статусу' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ShipmentsController.prototype, "getAllShipments", null);
__decorate([
    (0, common_1.Get)('status/:status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить отгрузки по статусу' }),
    __param(0, (0, common_1.Param)('status')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShipmentsController.prototype, "getShipmentsByStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить детали отгрузки' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShipmentsController.prototype, "getShipment", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить статус отгрузки' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ShipmentsController.prototype, "updateShipmentStatus", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Отменить отгрузку (вернуть товар на склад)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShipmentsController.prototype, "cancelShipment", null);
__decorate([
    (0, common_1.Get)(':id/waybill'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.MANAGER, client_1.UserRole.WAREHOUSE),
    (0, swagger_1.ApiOperation)({ summary: 'Получить данные для путевого листа' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShipmentsController.prototype, "getWaybillData", null);
exports.ShipmentsController = ShipmentsController = __decorate([
    (0, swagger_1.ApiTags)('Shipments'),
    (0, common_1.Controller)('shipments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [shipments_service_1.ShipmentsService])
], ShipmentsController);
//# sourceMappingURL=shipments.controller.js.map