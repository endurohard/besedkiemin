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
exports.TelegramController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const telegram_service_1 = require("./telegram.service");
const prisma_service_1 = require("../prisma/prisma.service");
let TelegramController = class TelegramController {
    constructor(telegramService, prisma) {
        this.telegramService = telegramService;
        this.prisma = prisma;
    }
    getTelegramLink(req) {
        const userId = req.user.userId;
        return {
            link: this.telegramService.generateTelegramLink(userId),
            botUsername: "besedkiemin_bot",
        };
    }
    async unlinkTelegram(req) {
        const userId = req.user.userId;
        await this.prisma.user.update({
            where: { id: userId },
            data: { telegramId: null },
        });
        return { success: true, message: "Telegram отвязан" };
    }
};
exports.TelegramController = TelegramController;
__decorate([
    (0, common_1.Get)("link"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TelegramController.prototype, "getTelegramLink", null);
__decorate([
    (0, common_1.Post)("unlink"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "unlinkTelegram", null);
exports.TelegramController = TelegramController = __decorate([
    (0, common_1.Controller)("telegram"),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService,
        prisma_service_1.PrismaService])
], TelegramController);
//# sourceMappingURL=telegram.controller.js.map