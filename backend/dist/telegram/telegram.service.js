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
const config_1 = require("@nestjs/config");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const claude_code_service_1 = require("../claude-code/claude-code.service");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor(prisma, configService, claudeCodeService) {
        this.prisma = prisma;
        this.configService = configService;
        this.claudeCodeService = claudeCodeService;
        this.logger = new common_1.Logger(TelegramService_1.name);
        this.userStates = new Map();
        this.loginCodes = new Map();
        this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN') || '';
        this.adminId = this.configService.get('TELEGRAM_ADMIN_ID') || '';
    }
    async onModuleInit() {
        if (!this.botToken) {
            this.logger.warn('TELEGRAM_BOT_TOKEN not configured. Telegram bot disabled.');
            return;
        }
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
                const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
                if (!user) {
                    await this.bot.sendMessage(chatId, '❌ Пользователь не найден');
                    return;
                }
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { telegramId },
                });
                await this.bot.sendMessage(chatId, `✅ Telegram успешно привязан!\n\n👤 ${user.firstName} ${user.lastName}\n🏢 Роль: ${user.role?.name || user.role?.code || 'Не указана'}\n\nТеперь вы будете получать уведомления.`);
            }
        });
        this.bot.onText(/\/start$/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            if (!telegramId)
                return;
            const user = await this.prisma.user.findFirst({ where: { telegramId }, include: { role: true } });
            if (user) {
                await this.bot.sendMessage(chatId, `✅ Аккаунт привязан:\n👤 ${user.firstName} ${user.lastName}\n🏢 ${user.role?.name || user.role?.code || 'Не указана'}\n\nИспользуйте /tasks`);
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
            const user = await this.prisma.user.findFirst({ where: { telegramId }, include: { role: true } });
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
        this.bot.onText(/\/login (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            const code = match?.[1]?.trim();
            if (!telegramId || !code) {
                await this.bot.sendMessage(chatId, '❌ Неверная команда. Используйте: /login КОД');
                return;
            }
            const loginData = this.loginCodes.get(code);
            if (!loginData) {
                await this.bot.sendMessage(chatId, '❌ Неверный или устаревший код авторизации');
                return;
            }
            if (new Date() > loginData.expiresAt) {
                this.loginCodes.delete(code);
                await this.bot.sendMessage(chatId, '❌ Срок действия кода истёк. Получите новый код на сайте.');
                return;
            }
            const user = await this.prisma.user.findUnique({ where: { id: loginData.userId }, include: { role: true } });
            if (!user) {
                await this.bot.sendMessage(chatId, '❌ Пользователь не найден');
                this.loginCodes.delete(code);
                return;
            }
            await this.prisma.user.update({
                where: { id: loginData.userId },
                data: { telegramId },
            });
            this.loginCodes.delete(code);
            await this.bot.sendMessage(chatId, `✅ Авторизация успешна!\n\n👤 ${user.firstName} ${user.lastName}\n🏢 Роль: ${user.role?.name || user.role?.code || 'Не указана'}\n\n🔔 Вы будете получать уведомления о задачах`);
        });
        this.bot.on('photo', async (msg) => {
            const chatId = msg.chat.id;
            if (!msg.from?.id)
                return;
            const state = this.userStates.get(msg.from.id);
            if (!state || state.action !== 'reject_task') {
                await this.bot.sendMessage(chatId, '❌ Нет активной браковки');
                return;
            }
            if (!msg.photo || msg.photo.length === 0) {
                await this.bot.sendMessage(chatId, '❌ Фото не найдено');
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
        this.bot.onText(/\/claude (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            const prompt = match?.[1];
            if (!telegramId || !prompt)
                return;
            const hasAccess = await this.checkClaudeAccess(telegramId);
            if (!hasAccess) {
                await this.bot.sendMessage(chatId, '❌ Доступ запрещён. Только владелец может использовать Claude Code.');
                return;
            }
            await this.bot.sendMessage(chatId, '🤖 Обрабатываю запрос к Claude Code...');
            const result = await this.claudeCodeService.askClaude(prompt);
            if (result.success) {
                const chunks = this.splitMessage(result.output, 4000);
                for (const chunk of chunks) {
                    await this.bot.sendMessage(chatId, chunk);
                }
            }
            else {
                await this.bot.sendMessage(chatId, `❌ Ошибка: ${result.error}`);
            }
        });
        this.bot.onText(/\/change (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            const prompt = match?.[1];
            if (!telegramId || !prompt)
                return;
            const hasAccess = await this.checkClaudeAccess(telegramId);
            if (!hasAccess) {
                await this.bot.sendMessage(chatId, '❌ Доступ запрещён. Только владелец может использовать Claude Code.');
                return;
            }
            await this.bot.sendMessage(chatId, '🔄 Анализирую изменения через Claude Code...\n\nЭто может занять несколько минут.');
            const result = await this.claudeCodeService.previewChange(prompt, true);
            if (result.success) {
                if (!result.previewId || !result.filesChanged?.length) {
                    await this.bot.sendMessage(chatId, '✅ Claude проанализировал запрос, но изменений в коде не требуется.');
                    return;
                }
                let message = '📋 *Preview изменений*\n\n';
                message += `📝 *Запрос:* ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}\n\n`;
                message += `📁 *Изменённые файлы (${result.filesChanged.length}):*\n`;
                message += result.filesChanged.slice(0, 8).map(f => `• \`${f}\``).join('\n');
                if (result.filesChanged.length > 8) {
                    message += `\n...и ещё ${result.filesChanged.length - 8} файлов`;
                }
                if (result.diff) {
                    message += '\n\n📄 *Diff:*\n```\n';
                    message += result.diff.substring(0, 1500);
                    if (result.diff.length > 1500) {
                        message += '\n... (обрезано)';
                    }
                    message += '\n```';
                }
                message += '\n\n⏳ *Preview истечёт через 30 минут*';
                await this.bot.sendMessage(chatId, message, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '✅ Применить и создать PR', callback_data: `claude_apply:${result.previewId}` },
                            ],
                            [
                                { text: '❌ Отменить', callback_data: `claude_cancel:${result.previewId}` },
                            ],
                        ],
                    },
                });
            }
            else {
                await this.bot.sendMessage(chatId, `❌ Ошибка: ${result.error}`);
            }
        });
        this.bot.on('callback_query', async (query) => {
            if (!query.data?.startsWith('claude_'))
                return;
            const chatId = query.message?.chat.id;
            const messageId = query.message?.message_id;
            const telegramId = query.from?.id.toString();
            if (!chatId || !messageId || !telegramId)
                return;
            const hasAccess = await this.checkClaudeAccess(telegramId);
            if (!hasAccess) {
                await this.bot.answerCallbackQuery(query.id, { text: '❌ Нет доступа' });
                return;
            }
            const [action, previewId] = query.data.split(':');
            if (action === 'claude_apply') {
                await this.bot.answerCallbackQuery(query.id, { text: '⏳ Применяю изменения...' });
                await this.bot.editMessageText('⏳ *Применяю изменения и создаю PR...*', {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                });
                const result = await this.claudeCodeService.applyPreview(previewId);
                if (result.success) {
                    let message = '✅ *Изменения применены!*\n\n';
                    if (result.filesChanged && result.filesChanged.length > 0) {
                        message += `📁 *Изменённые файлы:*\n`;
                        message += result.filesChanged.slice(0, 10).map(f => `• \`${f}\``).join('\n');
                        message += '\n\n';
                    }
                    if (result.branch) {
                        message += `🌿 Ветка: \`${result.branch}\`\n`;
                    }
                    if (result.prUrl) {
                        message += `\n🔗 [Открыть Pull Request](${result.prUrl})`;
                    }
                    await this.bot.editMessageText(message, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                    });
                }
                else {
                    await this.bot.editMessageText(`❌ *Ошибка:* ${result.error}`, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                    });
                }
            }
            else if (action === 'claude_cancel') {
                await this.bot.answerCallbackQuery(query.id, { text: '🗑 Отменяю...' });
                await this.claudeCodeService.cancelPreview(previewId);
                await this.bot.editMessageText('🗑 *Preview отменён*\n\nИзменения не были применены.', {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                });
            }
        });
        this.bot.onText(/\/apply (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            const prompt = match?.[1];
            if (!telegramId || !prompt)
                return;
            const hasAccess = await this.checkClaudeAccess(telegramId);
            if (!hasAccess) {
                await this.bot.sendMessage(chatId, '❌ Доступ запрещён. Только владелец может использовать Claude Code.');
                return;
            }
            await this.bot.sendMessage(chatId, '⚡ Применяю изменения напрямую...\n\n⚠️ Изменения будут в текущей ветке без PR!');
            const result = await this.claudeCodeService.executeDirectChange(prompt);
            if (result.success) {
                let message = '✅ *Изменения применены!*\n\n';
                if (result.filesChanged && result.filesChanged.length > 0) {
                    message += `📁 *Изменённые файлы:*\n`;
                    message += result.filesChanged.slice(0, 10).map(f => `• \`${f}\``).join('\n');
                    if (result.filesChanged.length > 10) {
                        message += `\n...и ещё ${result.filesChanged.length - 10} файлов`;
                    }
                }
                else {
                    message += 'Нет изменений в файлах.';
                }
                await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            }
            else {
                await this.bot.sendMessage(chatId, `❌ Ошибка: ${result.error}`);
            }
        });
        this.bot.onText(/\/gitstatus/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from?.id.toString();
            if (!telegramId)
                return;
            const hasAccess = await this.checkClaudeAccess(telegramId);
            if (!hasAccess) {
                await this.bot.sendMessage(chatId, '❌ Доступ запрещён.');
                return;
            }
            const [branch, status] = await Promise.all([
                this.claudeCodeService.getCurrentBranch(),
                this.claudeCodeService.getGitStatus(),
            ]);
            await this.bot.sendMessage(chatId, `📊 *Git Status*\n\n🌿 Ветка: \`${branch}\`\n\n\`\`\`\n${status || 'Чисто'}\n\`\`\``, { parse_mode: 'Markdown' });
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
                const telegramId = msg.from?.id.toString();
                const currentUser = telegramId ? await this.prisma.user.findFirst({ where: { telegramId }, include: { role: true } }) : null;
                const canSeeCustomerInfo = currentUser?.role?.code === 'MANAGER' || currentUser?.role?.code === 'LOGIST';
                let message = `${statusEmoji} *Заказ №${order.orderNumber}*\n\n`;
                message += `📊 Статус: *${statusText}*\n`;
                if (canSeeCustomerInfo) {
                    message += `👤 Клиент: ${order.customerName}\n`;
                }
                if (order.status === 'IN_PRODUCTION') {
                    message += `🔧 Прогресс: ${completedProducts}/${totalProducts} изделий готово\n`;
                }
                if (canSeeCustomerInfo && order.customerAddress) {
                    message += `📍 Адрес доставки: ${order.customerAddress}\n`;
                }
                await this.bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
            }
            else {
                const telegramId = msg.from?.id.toString();
                const user = await this.prisma.user.findFirst({ where: { telegramId }, include: { role: true } });
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
        const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!user || !user.telegramId)
            return;
        const chatId = parseInt(user.telegramId, 10);
        if (isNaN(chatId)) {
            this.logger.error(`Invalid Telegram ID for user ${userId}: ${user.telegramId}`);
            return;
        }
        try {
            await this.bot.sendMessage(chatId, `🆕 *Новая задача!*\n📋 ${taskTitle}\n📦 ${orderNumber}\n📊 ${quantity} шт.`, { parse_mode: 'Markdown' });
        }
        catch (error) {
            this.logger.error(`Failed to notify user ${userId}`, error);
        }
    }
    async requestDefectPhoto(userId, taskId, reason, quantity) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!user || !user.telegramId)
            return false;
        const chatId = parseInt(user.telegramId, 10);
        if (isNaN(chatId)) {
            this.logger.error(`Invalid Telegram ID for user ${userId}: ${user.telegramId}`);
            return false;
        }
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
    generateLoginCode(userId) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        this.loginCodes.set(code, { userId, expiresAt });
        this.logger.log(`Generated login code for user ${userId}: ${code}`);
        return code;
    }
    validateLoginCode(code) {
        const loginData = this.loginCodes.get(code);
        if (!loginData) {
            return { valid: false };
        }
        if (new Date() > loginData.expiresAt) {
            this.loginCodes.delete(code);
            return { valid: false };
        }
        return { valid: true, userId: loginData.userId };
    }
    removeLoginCode(code) {
        this.loginCodes.delete(code);
    }
    async checkClaudeAccess(telegramId) {
        if (telegramId === this.adminId) {
            return true;
        }
        const user = await this.prisma.user.findFirst({
            where: { telegramId },
            include: { role: true },
        });
        return user?.role?.code === 'OWNER';
    }
    splitMessage(text, maxLength) {
        if (text.length <= maxLength) {
            return [text];
        }
        const chunks = [];
        let currentChunk = '';
        const lines = text.split('\n');
        for (const line of lines) {
            if (currentChunk.length + line.length + 1 > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                if (line.length > maxLength) {
                    for (let i = 0; i < line.length; i += maxLength) {
                        chunks.push(line.substring(i, i + maxLength));
                    }
                    currentChunk = '';
                }
                else {
                    currentChunk = line;
                }
            }
            else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        return chunks;
    }
    async notifyAdmins(message) {
        if (!this.bot) {
            this.logger.warn('Telegram bot not configured. Skipping admin notification.');
            return;
        }
        try {
            if (this.adminId) {
                await this.bot.sendMessage(this.adminId, message, { parse_mode: 'HTML' });
                this.logger.log(`Уведомление отправлено администратору: ${this.adminId}`);
            }
            const admins = await this.prisma.user.findMany({
                where: {
                    role: { code: { in: ['OWNER', 'MANAGER'] } },
                    telegramId: { not: null },
                },
            });
            for (const admin of admins) {
                if (admin.telegramId && admin.telegramId !== this.adminId) {
                    try {
                        await this.bot.sendMessage(admin.telegramId, message, { parse_mode: 'HTML' });
                        this.logger.log(`Уведомление отправлено: ${admin.firstName} ${admin.lastName}`);
                    }
                    catch (error) {
                        this.logger.error(`Ошибка отправки уведомления пользователю ${admin.id}:`, error);
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Ошибка отправки уведомлений администраторам:', error);
            throw error;
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        claude_code_service_1.ClaudeCodeService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map