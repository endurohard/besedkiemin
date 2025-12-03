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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    constructor(chatService) {
        this.chatService = chatService;
        this.logger = new common_1.Logger('ChatGateway');
        this.connectedUsers = new Map();
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        for (const [key, value] of this.connectedUsers.entries()) {
            if (value.socketId === client.id) {
                this.connectedUsers.delete(key);
                break;
            }
        }
    }
    async handleJoinRoom(client, data) {
        try {
            const { roomId, userType, userId } = data;
            const room = await this.chatService.getRoom(roomId);
            client.join(roomId);
            const userKey = userId || `customer-${roomId}`;
            this.connectedUsers.set(userKey, {
                socketId: client.id,
                roomId,
                userType,
            });
            this.logger.log(`${userType} joined room ${roomId}`);
            client.emit('room_joined', {
                room,
                messages: room.messages,
            });
            if (userType === 'manager') {
                const unreadMessages = await this.chatService.getUnreadMessages(roomId);
                if (unreadMessages.length > 0) {
                    await this.chatService.markMessagesAsRead(roomId, unreadMessages.map((m) => m.id));
                    this.server.to(roomId).emit('messages_read', {
                        roomId,
                        messageIds: unreadMessages.map((m) => m.id),
                    });
                }
            }
            client.to(roomId).emit('user_joined', {
                userType,
                userId,
            });
            return { success: true, room };
        }
        catch (error) {
            this.logger.error(`Error joining room: ${error.message}`);
            client.emit('error', { message: error.message });
            return { success: false, error: error.message };
        }
    }
    async handleSendMessage(client, data) {
        try {
            const { roomId, content, senderType, senderId, senderName } = data;
            const message = await this.chatService.sendMessage({
                roomId,
                senderType,
                senderId,
                senderName,
                content,
            });
            this.server.to(roomId).emit('new_message', message);
            if (senderType === 'CUSTOMER') {
                const totalUnread = await this.chatService.getTotalUnreadCount();
                this.server.emit('unread_count_updated', { total: totalUnread });
            }
            this.logger.log(`Message sent in room ${roomId} by ${senderType}`);
            return { success: true, message };
        }
        catch (error) {
            this.logger.error(`Error sending message: ${error.message}`);
            client.emit('error', { message: error.message });
            return { success: false, error: error.message };
        }
    }
    handleTyping(client, data) {
        const { roomId, userType, userName } = data;
        client.to(roomId).emit('user_typing', {
            userType,
            userName,
        });
    }
    handleStopTyping(client, data) {
        const { roomId } = data;
        client.to(roomId).emit('user_stopped_typing');
    }
    async handleMarkAsRead(client, data) {
        try {
            const { roomId, messageIds } = data;
            await this.chatService.markMessagesAsRead(roomId, messageIds);
            this.server.to(roomId).emit('messages_read', {
                roomId,
                messageIds,
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Error marking messages as read: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    handleLeaveRoom(client, data) {
        const { roomId } = data;
        client.leave(roomId);
        this.logger.log(`Client ${client.id} left room ${roomId}`);
        client.to(roomId).emit('user_left');
        return { success: true };
    }
    async handleCheckOnline(client) {
        try {
            const status = await this.chatService.isOnline();
            client.emit('online_status', status);
            return status;
        }
        catch (error) {
            this.logger.error(`Error checking online status: ${error.message}`);
            return { online: false, message: 'Ошибка проверки статуса' };
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stop_typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleStopTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_as_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('check_online'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCheckOnline", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map