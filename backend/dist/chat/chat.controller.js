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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getStatus() {
        return this.chatService.isOnline();
    }
    async getOrCreateRoom(catalogOrderId) {
        return this.chatService.getOrCreateRoom(catalogOrderId);
    }
    async getOrCreateGuestRoom(body) {
        return this.chatService.getOrCreateGuestRoom(body);
    }
    async getAllRooms() {
        return this.chatService.getAllRooms();
    }
    async getRoom(roomId) {
        return this.chatService.getRoom(roomId);
    }
    async getUnreadMessages(roomId) {
        return this.chatService.getUnreadMessages(roomId);
    }
    async getTotalUnreadCount() {
        const total = await this.chatService.getTotalUnreadCount();
        return { total };
    }
    async markAsRead(roomId, body) {
        return this.chatService.markMessagesAsRead(roomId, body.messageIds);
    }
    async closeRoom(roomId) {
        return this.chatService.closeRoom(roomId);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Проверить статус чата (онлайн/оффлайн)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('rooms/order/:catalogOrderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать или получить комнату чата для заказа' }),
    __param(0, (0, common_1.Param)('catalogOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getOrCreateRoom", null);
__decorate([
    (0, common_1.Post)('rooms/guest'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать или получить гостевую комнату чата' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getOrCreateGuestRoom", null);
__decorate([
    (0, common_1.Get)('rooms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'MANAGER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все активные комнаты чата (OWNER/MANAGER)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getAllRooms", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить комнату чата по ID' }),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId/unread'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'MANAGER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить непрочитанные сообщения для комнаты (OWNER/MANAGER)' }),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUnreadMessages", null);
__decorate([
    (0, common_1.Get)('unread/total'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'MANAGER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить общее количество непрочитанных сообщений (OWNER/MANAGER)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getTotalUnreadCount", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/mark-read'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'MANAGER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Отметить сообщения как прочитанные (OWNER/MANAGER)' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/close'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'OWNER', 'MANAGER'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Закрыть комнату чата (OWNER/MANAGER)' }),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "closeRoom", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map