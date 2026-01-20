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
exports.OrderSourcesController = void 0;
const common_1 = require("@nestjs/common");
const order_sources_service_1 = require("./order-sources.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let OrderSourcesController = class OrderSourcesController {
    constructor(orderSourcesService) {
        this.orderSourcesService = orderSourcesService;
    }
    findAll() {
        return this.orderSourcesService.findAll();
    }
    findActive() {
        return this.orderSourcesService.findActive();
    }
    initialize() {
        return this.orderSourcesService.initializeDefaultSources();
    }
    findOne(id) {
        return this.orderSourcesService.findOne(id);
    }
    create(dto) {
        return this.orderSourcesService.create(dto);
    }
    update(id, dto) {
        return this.orderSourcesService.update(id, dto);
    }
    remove(id) {
        return this.orderSourcesService.remove(id);
    }
};
exports.OrderSourcesController = OrderSourcesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrderSourcesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrderSourcesController.prototype, "findActive", null);
__decorate([
    (0, common_1.Post)('initialize'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrderSourcesController.prototype, "initialize", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrderSourcesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateOrderSourceDto]),
    __metadata("design:returntype", void 0)
], OrderSourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateOrderSourceDto]),
    __metadata("design:returntype", void 0)
], OrderSourcesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrderSourcesController.prototype, "remove", null);
exports.OrderSourcesController = OrderSourcesController = __decorate([
    (0, common_1.Controller)('order-sources'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [order_sources_service_1.OrderSourcesService])
], OrderSourcesController);
//# sourceMappingURL=order-sources.controller.js.map