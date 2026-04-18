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
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const pin_login_dto_1 = require("./dto/pin-login.dto");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const telegram_service_1 = require("../telegram/telegram.service");
const users_service_1 = require("../users/users.service");
let AuthController = class AuthController {
    constructor(authService, telegramService, usersService) {
        this.authService = authService;
        this.telegramService = telegramService;
        this.usersService = usersService;
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
            throw new common_1.UnauthorizedException("Неверный email или пароль");
        }
        const code = this.telegramService.generateLoginCode(user.id);
        return {
            code,
            expiresIn: 300,
            message: "Отправьте команду /login " +
                code +
                " боту @besedkiemin_bot в Telegram",
        };
    }
    async checkTelegramAuth(body) {
        const validation = this.telegramService.validateLoginCode(body.code);
        if (!validation.valid) {
            throw new common_1.UnauthorizedException("Код не найден или истёк");
        }
        const user = await this.authService.findUserById(validation.userId);
        if (!user) {
            throw new common_1.UnauthorizedException("Пользователь не найден");
        }
        if (user.telegramId) {
            this.telegramService.removeLoginCode(body.code);
            return this.authService.login(user);
        }
        return {
            status: "pending",
            message: "Ожидание подтверждения в Telegram",
        };
    }
    async pinLogin(pinLoginDto) {
        const user = await this.authService.validatePin(pinLoginDto.pin);
        if (!user) {
            throw new common_1.UnauthorizedException("Неверный PIN-код");
        }
        return this.authService.login(user);
    }
    async setMyPin(user, body) {
        if (!body.pin || body.pin.length < 4 || body.pin.length > 6) {
            throw new common_1.BadRequestException("PIN-код должен содержать от 4 до 6 цифр");
        }
        if (!/^\d+$/.test(body.pin)) {
            throw new common_1.BadRequestException("PIN-код должен содержать только цифры");
        }
        await this.usersService.setPin(user.userId, body.pin);
        return { success: true, message: "PIN-код установлен" };
    }
    async setUserPin(userId, body) {
        if (!body.pin || body.pin.length < 4 || body.pin.length > 6) {
            throw new common_1.BadRequestException("PIN-код должен содержать от 4 до 6 цифр");
        }
        if (!/^\d+$/.test(body.pin)) {
            throw new common_1.BadRequestException("PIN-код должен содержать только цифры");
        }
        await this.usersService.setPin(userId, body.pin);
        return { success: true, message: "PIN-код установлен" };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard, local_auth_guard_1.LocalAuthGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.Post)("login"),
    (0, swagger_1.ApiOperation)({ summary: "Вход в систему" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("profile"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Получить профиль текущего пользователя" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)("telegram/request-code"),
    (0, swagger_1.ApiOperation)({
        summary: "Запросить код для авторизации через Telegram (публичный)",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestTelegramCode", null);
__decorate([
    (0, common_1.Post)("telegram/check-auth"),
    (0, swagger_1.ApiOperation)({
        summary: "Проверить статус авторизации через Telegram (для polling)",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkTelegramAuth", null);
__decorate([
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)("pin-login"),
    (0, swagger_1.ApiOperation)({
        summary: "Вход по PIN-коду (для производственных работников)",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pin_login_dto_1.PinLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "pinLogin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Post)("set-pin"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Установить PIN-код для текущего пользователя" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setMyPin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("OWNER", "SUPER_ADMIN"),
    (0, common_1.Post)("set-pin/:userId"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: "Установить PIN-код для работника (только владелец)",
    }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setUserPin", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)("Auth"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        telegram_service_1.TelegramService,
        users_service_1.UsersService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map