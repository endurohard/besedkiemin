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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async isOnline() {
        const settings = await this.prisma.companySettings.findFirst();
        if (!settings || !settings.chatEnabled) {
            return {
                online: false,
                message: settings?.offlineMessage || 'Чат временно недоступен',
            };
        }
        const now = new Date();
        const currentDay = now.getDay() || 7;
        const workingDays = settings.workingDays.split(',').map((d) => parseInt(d.trim()));
        if (!workingDays.includes(currentDay)) {
            return {
                online: false,
                message: settings.offlineMessage,
                workingHours: {
                    start: settings.workingHoursStart,
                    end: settings.workingHoursEnd,
                },
            };
        }
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const isWithinHours = currentTime >= settings.workingHoursStart && currentTime <= settings.workingHoursEnd;
        if (!isWithinHours) {
            return {
                online: false,
                message: settings.offlineMessage,
                workingHours: {
                    start: settings.workingHoursStart,
                    end: settings.workingHoursEnd,
                },
            };
        }
        return { online: true };
    }
    async getOrCreateRoom(catalogOrderId) {
        const order = await this.prisma.catalogOrder.findUnique({
            where: { id: catalogOrderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Заказ не найден');
        }
        let room = await this.prisma.chatRoom.findUnique({
            where: { catalogOrderId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                },
            },
        });
        if (!room) {
            room = await this.prisma.chatRoom.create({
                data: {
                    catalogOrderId,
                    customerName: order.customerName,
                },
                include: {
                    messages: true,
                },
            });
        }
        return room;
    }
    async getOrCreateGuestRoom(data) {
        let room = await this.prisma.chatRoom.findUnique({
            where: { guestSessionId: data.guestSessionId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                },
            },
        });
        if (!room) {
            room = await this.prisma.chatRoom.create({
                data: {
                    guestSessionId: data.guestSessionId,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                },
                include: {
                    messages: true,
                },
            });
        }
        return room;
    }
    async getAllRooms() {
        const rooms = await this.prisma.chatRoom.findMany({
            where: { isActive: true },
            orderBy: [
                { unreadCount: 'desc' },
                { lastMessageAt: 'desc' },
                { createdAt: 'desc' },
            ],
            include: {
                catalogOrder: {
                    select: {
                        id: true,
                        orderNumber: true,
                        customerPhone: true,
                        customerEmail: true,
                        status: true,
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        return rooms.map(room => ({
            ...room,
            catalogOrder: room.catalogOrder || {
                id: room.guestSessionId || room.id,
                orderNumber: room.guestSessionId ? `Гость #${room.guestSessionId.slice(-6)}` : 'Гостевой чат',
                customerPhone: room.customerPhone || '',
                customerEmail: room.customerEmail || '',
                status: 'GUEST',
            },
        }));
    }
    async getRoom(roomId) {
        const room = await this.prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
                catalogOrder: true,
            },
        });
        if (!room) {
            throw new common_1.NotFoundException('Комната чата не найдена');
        }
        return room;
    }
    async sendMessage(data) {
        const room = await this.prisma.chatRoom.findUnique({
            where: { id: data.roomId },
        });
        if (!room) {
            throw new common_1.NotFoundException('Комната чата не найдена');
        }
        const message = await this.prisma.chatMessage.create({
            data: {
                roomId: data.roomId,
                senderType: data.senderType,
                senderId: data.senderId || null,
                senderName: data.senderName,
                content: data.content,
            },
        });
        const updateData = {
            lastMessageAt: new Date(),
            lastMessageText: data.content,
        };
        if (data.senderType === 'CUSTOMER') {
            updateData.unreadCount = { increment: 1 };
        }
        await this.prisma.chatRoom.update({
            where: { id: data.roomId },
            data: updateData,
        });
        return message;
    }
    async markMessagesAsRead(roomId, messageIds) {
        const where = { roomId, isRead: false };
        if (messageIds && messageIds.length > 0) {
            where.id = { in: messageIds };
        }
        await this.prisma.chatMessage.updateMany({
            where,
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        const unreadCount = await this.prisma.chatMessage.count({
            where: {
                roomId,
                isRead: false,
                senderType: 'CUSTOMER',
            },
        });
        await this.prisma.chatRoom.update({
            where: { id: roomId },
            data: { unreadCount },
        });
        return { success: true };
    }
    async getUnreadMessages(roomId) {
        return this.prisma.chatMessage.findMany({
            where: {
                roomId,
                isRead: false,
                senderType: 'CUSTOMER',
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getTotalUnreadCount() {
        const rooms = await this.prisma.chatRoom.findMany({
            where: { isActive: true },
            select: { unreadCount: true },
        });
        return rooms.reduce((sum, room) => sum + room.unreadCount, 0);
    }
    async closeRoom(roomId) {
        return this.prisma.chatRoom.update({
            where: { id: roomId },
            data: { isActive: false },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map