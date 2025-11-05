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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const telegram_service_1 = require("../telegram/telegram.service");
let AuthController = class AuthController {
    constructor(authService, telegramService) {
        this.authService = authService;
        this.telegramService = telegramService;
    }
    async login(loginDto, req) {
        return this.authService.login(req.user);
    }
    getProfile(user) {
        return user;
    }
    async requestTelegramCode(body) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Неверный email или пароль');
        }
        const code = this.telegramService.generateLoginCode(user.id);
        return {
            code,
            expiresIn: 300,
            message: 'Отправьте команду /login ' + code + ' боту @besedkiemin_bot в Telegram'
        };
    }
    async checkTelegramAuth(body) {
        const validation = this.telegramService.validateLoginCode(body.code);
        if (!validation.valid) {
            throw new common_1.UnauthorizedException('Код не найден или истёк');
        }
        const user = await this.authService.findUserById(validation.userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Пользователь не найден');
        }
        if (user.telegramId) {
            this.telegramService.removeLoginCode(body.code);
            return this.authService.login(user);
        }
        return {
            status: 'pending',
            message: 'Ожидание подтверждения в Telegram'
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Вход в систему' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить профиль текущего пользователя' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('telegram/request-code'),
    (0, swagger_1.ApiOperation)({ summary: 'Запросить код для авторизации через Telegram (публичный)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestTelegramCode", null);
__decorate([
    (0, common_1.Post)('telegram/check-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Проверить статус авторизации через Telegram (для polling)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkTelegramAuth", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        telegram_service_1.TelegramService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map