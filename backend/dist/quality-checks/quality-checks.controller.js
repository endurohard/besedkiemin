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
exports.QualityChecksController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const quality_checks_service_1 = require("./quality-checks.service");
const create_quality_check_dto_1 = require("./dto/create-quality-check.dto");
const update_quality_check_dto_1 = require("./dto/update-quality-check.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const upload_service_1 = require("../upload/upload.service");
const multer_1 = require("multer");
const path_1 = require("path");
let QualityChecksController = class QualityChecksController {
    constructor(qualityChecksService, uploadService) {
        this.qualityChecksService = qualityChecksService;
        this.uploadService = uploadService;
    }
    create(createQualityCheckDto, file, req) {
        return this.qualityChecksService.create(createQualityCheckDto, req.user.userId, file);
    }
    findAll(productId, status) {
        return this.qualityChecksService.findAll({ productId, status });
    }
    getRejected() {
        return this.qualityChecksService.getRejected();
    }
    getByProduct(productId) {
        return this.qualityChecksService.getByProduct(productId);
    }
    findOne(id) {
        return this.qualityChecksService.findOne(id);
    }
    update(id, updateQualityCheckDto, file) {
        return this.qualityChecksService.update(id, updateQualityCheckDto, file);
    }
    remove(id) {
        return this.qualityChecksService.remove(id);
    }
};
exports.QualityChecksController = QualityChecksController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)("WAREHOUSE"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("photo", {
        storage: (0, multer_1.diskStorage)({
            destination: "./uploads",
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `defect-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) {
                return callback(new common_1.BadRequestException("Разрешены только изображения (jpg, png, gif, webp, heic)"), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiOperation)({ summary: "Создать проверку качества (только складист)" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: {
                productId: { type: "string", format: "uuid" },
                status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                notes: { type: "string" },
                photo: { type: "string", format: "binary" },
            },
            required: ["productId", "status"],
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_quality_check_dto_1.CreateQualityCheckDto, Object, Object]),
    __metadata("design:returntype", void 0)
], QualityChecksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Получить все проверки качества" }),
    (0, swagger_1.ApiQuery)({ name: "productId", required: false }),
    (0, swagger_1.ApiQuery)({ name: "status", required: false, enum: client_1.QualityStatus }),
    __param(0, (0, common_1.Query)("productId")),
    __param(1, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QualityChecksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("rejected"),
    (0, swagger_1.ApiOperation)({ summary: "Получить все забракованные продукты" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QualityChecksController.prototype, "getRejected", null);
__decorate([
    (0, common_1.Get)("product/:productId"),
    (0, swagger_1.ApiOperation)({ summary: "Получить проверки качества для продукта" }),
    __param(0, (0, common_1.Param)("productId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QualityChecksController.prototype, "getByProduct", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Получить проверку качества по ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QualityChecksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)("WAREHOUSE"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("photo", {
        storage: (0, multer_1.diskStorage)({
            destination: "./uploads",
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `defect-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) {
                return callback(new common_1.BadRequestException("Разрешены только изображения (jpg, png, gif, webp, heic)"), false);
            }
            callback(null, true);
        },
    })),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiOperation)({ summary: "Обновить проверку качества (только складист)" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: {
                status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                notes: { type: "string" },
                photo: { type: "string", format: "binary" },
            },
        },
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_quality_check_dto_1.UpdateQualityCheckDto, Object]),
    __metadata("design:returntype", void 0)
], QualityChecksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)("WAREHOUSE", "MANAGER"),
    (0, swagger_1.ApiOperation)({
        summary: "Удалить проверку качества (складист или менеджер)",
    }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QualityChecksController.prototype, "remove", null);
exports.QualityChecksController = QualityChecksController = __decorate([
    (0, swagger_1.ApiTags)("quality-checks"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("quality-checks"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [quality_checks_service_1.QualityChecksService,
        upload_service_1.UploadService])
], QualityChecksController);
//# sourceMappingURL=quality-checks.controller.js.map