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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TelegramService_1.name);
        this.botToken = '8406603601:AAEdJDXar7oTYkxyFPW6Gn-m5bXwFZrQX9U';
        this.userStates = new Map();
    }
    async onModuleInit() {
        this.logger.log('Initializing Telegram Bot...');
        this.bot = new node_telegram_bot_api_1.default(this.botToken, { polling: true });
        this.logger.log('Telegram Bot is running!');
        this.registerCommands();
    }
    registerCommands() {
        this.bot.onText(/\/start (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            const userId = match?.[1];
            if (!telegramId) {
                await this.bot.sendMessage(chatId, '❌ Ошибка определения Telegram ID');
                return;
            }
            if (userId) {
                const user = await this.prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    await this.bot.sendMessage(chatId, '❌ Пользователь не найден');
                    return;
                }
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { telegramId },
                });
                await this.bot.sendMessage(chatId, `✅ Telegram успешно привязан!\n\n👤 ${user.firstName} ${user.lastName}\n🏢 Роль: ${user.role}\n\nТеперь вы будете получать уведомления.`);
            }
        });
        this.bot.onText(/\/start$/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            if (!telegramId)
                return;
            const user = await this.prisma.user.findFirst({ where: { telegramId } });
            if (user) {
                await this.bot.sendMessage(chatId, `✅ Аккаунт привязан:\n👤 ${user.firstName} ${user.lastName}\n🏢 ${user.role}\n\nИспользуйте /tasks`);
            }
            else {
                await this.bot.sendMessage(chatId, `👋 Для привязки отсканируйте QR код в профиле.\n\n📝 Telegram ID: \`${telegramId}\``, { parse_mode: 'Markdown' });
            }
        });
        this.bot.onText(/\/tasks/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            if (!telegramId)
                return;
            const user = await this.prisma.user.findFirst({ where: { telegramId } });
            if (!user) {
                await this.bot.sendMessage(chatId, '❌ Аккаунт не привязан');
                return;
            }
            const tasks = await this.prisma.task.findMany({
                where: {
                    assignedToId: user.id,
                    status: { in: [client_1.TaskStatus.NEW, client_1.TaskStatus.ACCEPTED] },
                },
                include: { product: { include: { order: true, productType: true } } },
                orderBy: { createdAt: 'desc' },
            });
            if (tasks.length === 0) {
                await this.bot.sendMessage(chatId, '📋 Нет активных задач');
                return;
            }
            let message = '📋 *Активные задачи:*\n\n';
            tasks.forEach((task, i) => {
                const emoji = task.status === client_1.TaskStatus.NEW ? '🆕' : '⏳';
                message += `${i + 1}. ${emoji} ${task.title}\n`;
                message += `   📦 ${task.product?.order?.orderNumber}\n`;
                message += `   📊 ${task.quantity} шт.\n\n`;
            });
            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        });
        this.bot.on('photo', async (msg) => {
            const chatId = msg.chat.id;
            const state = this.userStates.get(msg.from.id);
            if (!state || state.action !== 'reject_task') {
                await this.bot.sendMessage(chatId, '❌ Нет активной браковки');
                return;
            }
            const photo = msg.photo[msg.photo.length - 1];
            const file = await this.bot.getFile(photo.file_id);
            const fileUrl = `https://api.telegram.org/file/bot${this.botToken}/${file.file_path}`;
            state.photosCollected = state.photosCollected || [];
            state.photosCollected.push(fileUrl);
            const photosRemaining = (state.photosToCollect || state.quantity) - state.photosCollected.length;
            this.logger.log(`Photo ${state.photosCollected.length}/${state.photosToCollect || state.quantity} received for task ${state.taskId}: ${fileUrl}`);
            if (photosRemaining > 0) {
                await this.bot.sendMessage(chatId, `✅ Фото ${state.photosCollected.length}/${state.photosToCollect || state.quantity} получено!\n` +
                    `📸 Отправьте еще ${photosRemaining} ${photosRemaining === 1 ? 'фото' : photosRemaining < 5 ? 'фото' : 'фото'}`, { parse_mode: 'Markdown' });
                this.userStates.set(msg.from.id, state);
            }
            else {
                try {
                    await this.prisma.task.update({
                        where: { id: state.taskId },
                        data: {
                            defectPhotos: state.photosCollected,
                            notes: state.reason,
                        },
                    });
                    await this.bot.sendMessage(chatId, `✅ Все фото получены!\n📦 Задача обновлена\n📝 ${state.reason}\n📊 ${state.quantity} шт.`, { parse_mode: 'Markdown' });
                }
                catch (error) {
                    this.logger.error(`Failed to update task ${state.taskId}`, error);
                    await this.bot.sendMessage(chatId, '❌ Ошибка при обновлении задачи');
                }
                this.userStates.delete(msg.from.id);
            }
        });
        this.bot.on('text', async (msg) => {
            if (msg.text?.startsWith('/'))
                return;
            const text = msg.text?.trim();
            if (!text)
                return;
            const order = await this.prisma.order.findFirst({
                where: { orderNumber: text },
                include: {
                    products: {
                        include: {
                            productType: true,
                            tasks: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                            },
                        },
                    },
                },
            });
            if (order) {
                let statusText = '';
                let statusEmoji = '';
                if (order.status === 'NEW') {
                    statusText = 'Новый заказ';
                    statusEmoji = '📝';
                }
                else if (order.status === 'IN_PRODUCTION') {
                    statusText = 'В производстве';
                    statusEmoji = '⚙️';
                }
                else if (order.status === 'COMPLETED') {
                    const shipment = await this.prisma.shipment.findFirst({
                        where: {
                            items: {
                                some: {
                                    inventoryItem: {
                                        orderId: order.id,
                                    },
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    });
                    if (shipment) {
                        if (shipment.status === 'PENDING') {
                            statusText = 'Готов к отгрузке';
                            statusEmoji = '📦';
                        }
                        else if (shipment.status === 'IN_TRANSIT') {
                            statusText = 'В пути к адресату';
                            statusEmoji = '🚚';
                        }
                        else if (shipment.status === 'DELIVERED') {
                            statusText = 'Доставлен';
                            statusEmoji = '✅';
                        }
                    }
                    else {
                        statusText = 'Завершен (на складе)';
                        statusEmoji = '✅';
                    }
                }
                else if (order.status === 'CANCELLED') {
                    statusText = 'Отменен';
                    statusEmoji = '❌';
                }
                const totalProducts = order.products.length;
                const completedProducts = order.products.filter(p => p.stage === 'COMPLETED' || p.stage === 'QUALITY_CHECK').length;
                let message = `${statusEmoji} *Заказ №${order.orderNumber}*\n\n`;
                message += `📊 Статус: *${statusText}*\n`;
                message += `👤 Клиент: ${order.customerName}\n`;
                if (order.status === 'IN_PRODUCTION') {
                    message += `🔧 Прогресс: ${completedProducts}/${totalProducts} изделий готово\n`;
                }
                if (order.customerAddress) {
                    message += `📍 Адрес доставки: ${order.customerAddress}\n`;
                }
                await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
            }
            else {
                const telegramId = msg.from?.id.toString();
                const user = await this.prisma.user.findFirst({ where: { telegramId } });
                if (user) {
                    await this.bot.sendMessage(msg.chat.id, 'ℹ️ Используйте команды:\n/tasks - мои задачи\n\nИли отправьте номер заказа для проверки статуса');
                }
                else {
                    await this.bot.sendMessage(msg.chat.id, '📋 Отправьте номер заказа для проверки статуса\n\nДля сотрудников:\n/start - привязка аккаунта');
                }
            }
        });
    }
    async notifyNewTask(userId, taskTitle, orderNumber, quantity) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.telegramId)
            return;
        try {
            await this.bot.sendMessage(parseInt(user.telegramId), `🆕 *Новая задача!*\n📋 ${taskTitle}\n📦 ${orderNumber}\n📊 ${quantity} шт.`, { parse_mode: 'Markdown' });
        }
        catch (error) {
            this.logger.error(`Failed to notify user ${userId}`, error);
        }
    }
    async requestDefectPhoto(userId, taskId, reason, quantity) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.telegramId)
            return false;
        const chatId = parseInt(user.telegramId);
        this.userStates.set(chatId, {
            action: 'reject_task',
            taskId,
            reason,
            quantity,
            photosToCollect: quantity,
            photosCollected: [],
        });
        try {
            await this.bot.sendMessage(chatId, `📸 *Фото брака*\n📝 ${reason}\n📊 ${quantity} шт.\n\n` +
                `Отправьте ${quantity} ${quantity === 1 ? 'фото' : quantity < 5 ? 'фото' : 'фото'} брака (по одному на каждую штуку).\n` +
                `Осталось отправить: ${quantity}`, { parse_mode: 'Markdown' });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to request photo from ${userId}`, error);
            return false;
        }
    }
    generateTelegramLink(userId) {
        return `https://t.me/besedkiemin_bot?start=${userId}`;
    }
    async sendDefectNotification(productData) {
        this.logger.log(`Defect notification requested for product: ${productData.productName}`);
    }
    async sendMessage(chatId, message) {
        if (!this.bot) {
            this.logger.warn('Telegram bot not configured. Skipping message.');
            return;
        }
        try {
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
            });
            this.logger.log(`Message sent to chat: ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send Telegram message to ${chatId}`, error);
        }
    }
    async sendPhotoMessage(chatId, photoUrl, caption) {
        if (!this.bot) {
            this.logger.warn('Telegram bot not configured. Skipping photo message.');
            return;
        }
        try {
            await this.bot.sendPhoto(chatId, photoUrl, {
                caption,
                parse_mode: 'Markdown',
            });
            this.logger.log(`Photo message sent to chat: ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send Telegram photo to ${chatId}`, error);
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map