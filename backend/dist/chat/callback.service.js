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
var CallbackService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
let CallbackService = CallbackService_1 = class CallbackService {
    constructor(prisma, telegramService) {
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.logger = new common_1.Logger(CallbackService_1.name);
    }
    async create(data) {
        const request = await this.prisma.callbackRequest.create({
            data: {
                name: data.name,
                phone: data.phone,
                message: data.message || null,
                catalogOrderId: data.catalogOrderId || null,
                preferredTime: data.preferredTime || null,
                status: 'NEW',
            },
        });
        try {
            let telegramMessage = `📞 <b>Заявка на обратный звонок</b>\n\n`;
            telegramMessage += `👤 <b>Клиент:</b> ${data.name}\n`;
            telegramMessage += `📱 <b>Телефон:</b> ${data.phone}\n`;
            if (data.message) {
                telegramMessage += `💬 <b>Сообщение:</b> ${data.message}\n`;
            }
            if (data.preferredTime) {
                telegramMessage += `⏰ <b>Предпочтительное время:</b> ${data.preferredTime}\n`;
            }
            if (data.catalogOrderId) {
                const order = await this.prisma.catalogOrder.findUnique({
                    where: { id: data.catalogOrderId },
                    select: { orderNumber: true },
                });
                if (order) {
                    telegramMessage += `📋 <b>Заказ:</b> ${order.orderNumber}\n`;
                }
            }
            telegramMessage += `\n⏰ <b>Время заявки:</b> ${new Date().toLocaleString('ru-RU')}`;
            await this.telegramService.notifyAdmins(telegramMessage);
        }
        catch (error) {
            this.logger.error('Ошибка отправки уведомления в Telegram:', error);
        }
        return request;
    }
    async findAll(status) {
        const where = status ? { status } : {};
        return this.prisma.callbackRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const request = await this.prisma.callbackRequest.findUnique({
            where: { id },
        });
        if (!request) {
            throw new common_1.NotFoundException(`Заявка с ID ${id} не найдена`);
        }
        return request;
    }
    async updateStatus(id, status, userId, notes) {
        await this.findOne(id);
        return this.prisma.callbackRequest.update({
            where: { id },
            data: {
                status,
                processedBy: userId,
                processedAt: new Date(),
                notes: notes || undefined,
            },
        });
    }
    async markContacted(id, userId, notes) {
        return this.updateStatus(id, 'CONTACTED', userId, notes);
    }
    async markCompleted(id, userId, notes) {
        return this.updateStatus(id, 'COMPLETED', userId, notes);
    }
    async cancel(id, userId, notes) {
        return this.updateStatus(id, 'CANCELLED', userId, notes);
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.callbackRequest.delete({
            where: { id },
        });
    }
};
exports.CallbackService = CallbackService;
exports.CallbackService = CallbackService = CallbackService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], CallbackService);
//# sourceMappingURL=callback.service.js.map