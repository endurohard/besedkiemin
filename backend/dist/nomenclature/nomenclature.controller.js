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
exports.NomenclatureController = void 0;
const common_1 = require("@nestjs/common");
const nomenclature_service_1 = require("./nomenclature.service");
const create_nomenclature_dto_1 = require("./dto/create-nomenclature.dto");
const update_nomenclature_dto_1 = require("./dto/update-nomenclature.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let NomenclatureController = class NomenclatureController {
    constructor(nomenclatureService) {
        this.nomenclatureService = nomenclatureService;
    }
    create(createDto) {
        return this.nomenclatureService.create(createDto);
    }
    findAll(includeInactive) {
        return this.nomenclatureService.findAll(includeInactive === "true");
    }
    findByProductType(productTypeId, includeInactive) {
        return this.nomenclatureService.findByProductType(productTypeId, includeInactive === "true");
    }
    findOne(id) {
        return this.nomenclatureService.findOne(id);
    }
    update(id, updateDto) {
        return this.nomenclatureService.update(id, updateDto);
    }
    toggleActive(id) {
        return this.nomenclatureService.toggleActive(id);
    }
    remove(id) {
        return this.nomenclatureService.remove(id);
    }
};
exports.NomenclatureController = NomenclatureController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)("nomenclature:manage"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_nomenclature_dto_1.CreateNomenclatureDto]),
    __metadata("design:returntype", void 0)
], NomenclatureController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)("nomenclature:view"),
    __param(0, (0, common_1.Query)("includeInactive")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NomenclatureController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("by-type/:productTypeId"),
    (0, permissions_decorator_1.RequirePermissions)("nomenclature:view"),
    __param(0, (0, common_1.Param)("productTypeId")),
    __param(1, (0, common_1.Query)("includeInactive")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], NomenclatureController.prototype, "findByProductType", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.RequirePermissions)("nomenclature:view"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NomenclatureController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.RequirePermissions)("nomenclature:manage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_nomenclature_dto_1.UpdateNomenclatureDto]),
    __metadata("design:returntype", void 0)
], NomenclatureController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(":id/toggle-active"),
    (0, permissions_decorator_1.RequirePermissions)("nomenclature:manage"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NomenclatureController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_decorator_1.RequirePermissions)("nomenclature:manage"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NomenclatureController.prototype, "remove", null);
exports.NomenclatureController = NomenclatureController = __decorate([
    (0, common_1.Controller)("nomenclature"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [nomenclature_service_1.NomenclatureService])
], NomenclatureController);
//# sourceMappingURL=nomenclature.controller.js.map