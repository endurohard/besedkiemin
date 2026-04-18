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
exports.YeastarController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const yeastar_service_1 = require("./yeastar.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let YeastarController = class YeastarController {
    constructor(yeastarService, prisma) {
        this.yeastarService = yeastarService;
        this.prisma = prisma;
    }
    async makeCall(req, body) {
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user?.sipServer || !user?.sipUser || !user?.sipPassword) {
            return {
                success: false,
                message: "SIP настройки не настроены для пользователя",
            };
        }
        try {
            const config = {
                host: user.sipServer,
                username: "admin",
                password: "admin",
                extension: user.sipUser,
            };
            const result = await this.yeastarService.makeCall(config, body.phoneNumber);
            return {
                success: true,
                callid: result.callid,
                status: result.status,
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async hangupCall(req, body) {
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user?.sipServer) {
            return {
                success: false,
                message: "SIP настройки не настроены",
            };
        }
        try {
            const config = {
                host: user.sipServer,
                username: "admin",
                password: "admin",
                extension: user.sipUser,
            };
            await this.yeastarService.hangupCall(config, body.callid);
            return {
                success: true,
                message: "Звонок завершён",
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async getActiveCalls(req) {
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user?.sipServer) {
            return {
                success: false,
                calls: [],
            };
        }
        try {
            const config = {
                host: user.sipServer,
                username: "admin",
                password: "admin",
                extension: user.sipUser,
            };
            const calls = await this.yeastarService.getActiveCalls(config);
            return {
                success: true,
                calls: calls,
            };
        }
        catch (error) {
            return {
                success: false,
                calls: [],
                message: error.message,
            };
        }
    }
};
exports.YeastarController = YeastarController;
__decorate([
    (0, common_1.Post)("call"),
    (0, swagger_1.ApiOperation)({ summary: "Совершить звонок через Yeastar API" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], YeastarController.prototype, "makeCall", null);
__decorate([
    (0, common_1.Post)("hangup"),
    (0, swagger_1.ApiOperation)({ summary: "Завершить звонок" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], YeastarController.prototype, "hangupCall", null);
__decorate([
    (0, common_1.Get)("active-calls"),
    (0, swagger_1.ApiOperation)({ summary: "Получить активные звонки" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], YeastarController.prototype, "getActiveCalls", null);
exports.YeastarController = YeastarController = __decorate([
    (0, swagger_1.ApiTags)("yeastar"),
    (0, common_1.Controller)("yeastar"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [yeastar_service_1.YeastarService,
        prisma_service_1.PrismaService])
], YeastarController);
//# sourceMappingURL=yeastar.controller.js.map