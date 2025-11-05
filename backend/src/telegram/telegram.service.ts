import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private readonly botToken = '8406603601:AAEdJDXar7oTYkxyFPW6Gn-m5bXwFZrQX9U';

  // Хранилище состояний пользователей для обработки фото
  private userStates = new Map<number, {
    action: 'reject_task';
    taskId: string;
    reason: string;
    quantity: number;
    photosToCollect?: number;
    photosCollected?: string[];
  }>();

  // Хранилище кодов авторизации: код -> { userId, expiresAt }
  private loginCodes = new Map<string, { userId: string; expiresAt: Date }>();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Initializing Telegram Bot...');
    this.bot = new TelegramBot(this.botToken, { polling: true });
    this.logger.log('Telegram Bot is running!');
    this.registerCommands();
  }

  private registerCommands() {
    // Команда /start с параметром userId для привязки через QR
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

        await this.bot.sendMessage(
          chatId,
          `✅ Telegram успешно привязан!\n\n👤 ${user.firstName} ${user.lastName}\n🏢 Роль: ${user.role}\n\nТеперь вы будете получать уведомления.`
        );
      }
    });

    // /start без параметров
    this.bot.onText(/\/start$/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      if (!telegramId) return;

      const user = await this.prisma.user.findFirst({ where: { telegramId } });
      if (user) {
        await this.bot.sendMessage(
          chatId,
          `✅ Аккаунт привязан:\n👤 ${user.firstName} ${user.lastName}\n🏢 ${user.role}\n\nИспользуйте /tasks`
        );
      } else {
        await this.bot.sendMessage(
          chatId,
          `👋 Для привязки отсканируйте QR код в профиле.\n\n📝 Telegram ID: \`${telegramId}\``,
          { parse_mode: 'Markdown' }
        );
      }
    });

    // /tasks
    this.bot.onText(/\/tasks/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      if (!telegramId) return;

      const user = await this.prisma.user.findFirst({ where: { telegramId } });
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ Аккаунт не привязан');
        return;
      }

      const tasks = await this.prisma.task.findMany({
        where: {
          assignedToId: user.id,
          status: { in: [TaskStatus.NEW, TaskStatus.ACCEPTED] },
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
        const emoji = task.status === TaskStatus.NEW ? '🆕' : '⏳';
        message += `${i + 1}. ${emoji} ${task.title}\n`;
        message += `   📦 ${task.product?.order?.orderNumber}\n`;
        message += `   📊 ${task.quantity} шт.\n\n`;
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    // /login - авторизация через код
    this.bot.onText(/\/login (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      const code = match?.[1]?.trim();

      if (!telegramId || !code) {
        await this.bot.sendMessage(chatId, '❌ Неверная команда. Используйте: /login КОД');
        return;
      }

      // Проверяем код
      const loginData = this.loginCodes.get(code);
      if (!loginData) {
        await this.bot.sendMessage(chatId, '❌ Неверный или устаревший код авторизации');
        return;
      }

      // Проверяем срок действия
      if (new Date() > loginData.expiresAt) {
        this.loginCodes.delete(code);
        await this.bot.sendMessage(chatId, '❌ Срок действия кода истёк. Получите новый код на сайте.');
        return;
      }

      // Привязываем Telegram к пользователю
      const user = await this.prisma.user.findUnique({ where: { id: loginData.userId } });
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ Пользователь не найден');
        this.loginCodes.delete(code);
        return;
      }

      await this.prisma.user.update({
        where: { id: loginData.userId },
        data: { telegramId },
      });

      // Удаляем использованный код
      this.loginCodes.delete(code);

      await this.bot.sendMessage(
        chatId,
        `✅ Авторизация успешна!\n\n👤 ${user.firstName} ${user.lastName}\n🏢 Роль: ${user.role}\n\n🔔 Вы будете получать уведомления о задачах`
      );
    });

    // Обработка фото для браковки
    this.bot.on('photo', async (msg) => {
      const chatId = msg.chat.id;
      const state = this.userStates.get(msg.from!.id);

      if (!state || state.action !== 'reject_task') {
        await this.bot.sendMessage(chatId, '❌ Нет активной браковки');
        return;
      }

      const photo = msg.photo![msg.photo!.length - 1];
      const file = await this.bot.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${this.botToken}/${file.file_path}`;

      // Добавляем фото в массив собранных
      state.photosCollected = state.photosCollected || [];
      state.photosCollected.push(fileUrl);

      const photosRemaining = (state.photosToCollect || state.quantity) - state.photosCollected.length;

      this.logger.log(`Photo ${state.photosCollected.length}/${state.photosToCollect || state.quantity} received for task ${state.taskId}: ${fileUrl}`);

      if (photosRemaining > 0) {
        // Еще нужны фото
        await this.bot.sendMessage(
          chatId,
          `✅ Фото ${state.photosCollected.length}/${state.photosToCollect || state.quantity} получено!\n` +
          `📸 Отправьте еще ${photosRemaining} ${photosRemaining === 1 ? 'фото' : photosRemaining < 5 ? 'фото' : 'фото'}`,
          { parse_mode: 'Markdown' }
        );
        // Обновляем состояние
        this.userStates.set(msg.from!.id, state);
      } else {
        // Все фото собраны, обновляем задачу
        try {
          await this.prisma.task.update({
            where: { id: state.taskId },
            data: {
              defectPhotos: state.photosCollected,
              notes: state.reason,
            },
          });

          await this.bot.sendMessage(
            chatId,
            `✅ Все фото получены!\n📦 Задача обновлена\n📝 ${state.reason}\n📊 ${state.quantity} шт.`,
            { parse_mode: 'Markdown' }
          );
        } catch (error) {
          this.logger.error(`Failed to update task ${state.taskId}`, error);
          await this.bot.sendMessage(chatId, '❌ Ошибка при обновлении задачи');
        }

        this.userStates.delete(msg.from!.id);
      }
    });

    // Текстовые сообщения - проверка статуса заказа
    this.bot.on('text', async (msg) => {
      if (msg.text?.startsWith('/')) return;

      const text = msg.text?.trim();
      if (!text) return;

      // Проверяем, может это номер заказа
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
        // Определяем текущий статус заказа
        let statusText = '';
        let statusEmoji = '';

        if (order.status === 'NEW') {
          statusText = 'Новый заказ';
          statusEmoji = '📝';
        } else if (order.status === 'IN_PRODUCTION') {
          statusText = 'В производстве';
          statusEmoji = '⚙️';
        } else if (order.status === 'COMPLETED') {
          // Проверяем, отгружен ли заказ
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
            } else if (shipment.status === 'IN_TRANSIT') {
              statusText = 'В пути к адресату';
              statusEmoji = '🚚';
            } else if (shipment.status === 'DELIVERED') {
              statusText = 'Доставлен';
              statusEmoji = '✅';
            }
          } else {
            statusText = 'Завершен (на складе)';
            statusEmoji = '✅';
          }
        } else if (order.status === 'CANCELLED') {
          statusText = 'Отменен';
          statusEmoji = '❌';
        }

        // Подсчитываем прогресс производства
        const totalProducts = order.products.length;
        const completedProducts = order.products.filter(
          p => p.stage === 'COMPLETED' || p.stage === 'QUALITY_CHECK'
        ).length;

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
      } else {
        // Проверяем, привязан ли пользователь
        const telegramId = msg.from?.id.toString();
        const user = await this.prisma.user.findFirst({ where: { telegramId } });

        if (user) {
          await this.bot.sendMessage(
            msg.chat.id,
            'ℹ️ Используйте команды:\n/tasks - мои задачи\n\nИли отправьте номер заказа для проверки статуса'
          );
        } else {
          await this.bot.sendMessage(
            msg.chat.id,
            '📋 Отправьте номер заказа для проверки статуса\n\nДля сотрудников:\n/start - привязка аккаунта'
          );
        }
      }
    });
  }

  async notifyNewTask(userId: string, taskTitle: string, orderNumber: string, quantity: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.telegramId) return;

    try {
      await this.bot.sendMessage(
        parseInt(user.telegramId),
        `🆕 *Новая задача!*\n📋 ${taskTitle}\n📦 ${orderNumber}\n📊 ${quantity} шт.`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      this.logger.error(`Failed to notify user ${userId}`, error);
    }
  }

  async requestDefectPhoto(userId: string, taskId: string, reason: string, quantity: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.telegramId) return false;

    const chatId = parseInt(user.telegramId);
    this.userStates.set(chatId, {
      action: 'reject_task',
      taskId,
      reason,
      quantity,
      photosToCollect: quantity,  // Сколько фото нужно собрать
      photosCollected: [],         // Массив собранных URL фото
    });

    try {
      await this.bot.sendMessage(
        chatId,
        `📸 *Фото брака*\n📝 ${reason}\n📊 ${quantity} шт.\n\n` +
        `Отправьте ${quantity} ${quantity === 1 ? 'фото' : quantity < 5 ? 'фото' : 'фото'} брака (по одному на каждую штуку).\n` +
        `Осталось отправить: ${quantity}`,
        { parse_mode: 'Markdown' }
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to request photo from ${userId}`, error);
      return false;
    }
  }

  generateTelegramLink(userId: string): string {
    return `https://t.me/besedkiemin_bot?start=${userId}`;
  }

  async sendDefectNotification(productData: {
    productName: string;
    productType: string;
    orderNumber: string;
    customerName: string;
    notes?: string;
    photoUrl?: string;
  }): Promise<void> {
    this.logger.log(`Defect notification requested for product: ${productData.productName}`);
    // This method is kept for compatibility but can be extended later
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn('Telegram bot not configured. Skipping message.');
      return;
    }

    try {
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });
      this.logger.log(`Message sent to chat: ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to send Telegram message to ${chatId}`, error);
    }
  }

  async sendPhotoMessage(chatId: string, photoUrl: string, caption: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to send Telegram photo to ${chatId}`, error);
    }
  }

  /**
   * Генерирует код для авторизации через Telegram
   */
  generateLoginCode(userId: string): string {
    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Код действителен 5 минут
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    this.loginCodes.set(code, { userId, expiresAt });

    this.logger.log(`Generated login code for user ${userId}: ${code}`);

    return code;
  }

  /**
   * Проверяет, существует ли код и не истёк ли он
   */
  validateLoginCode(code: string): { valid: boolean; userId?: string } {
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

  /**
   * Удаляет использованный код
   */
  removeLoginCode(code: string): void {
    this.loginCodes.delete(code);
  }

  /**
   * Отправляет уведомление всем администраторам
   */
  async notifyAdmins(message: string): Promise<void> {
    try {
      // Получаем admin ID из переменной окружения
      const adminId = process.env.TELEGRAM_ADMIN_ID;

      if (adminId) {
        await this.bot.sendMessage(adminId, message, { parse_mode: 'HTML' });
        this.logger.log(`Уведомление отправлено администратору: ${adminId}`);
      }

      // Также отправляем всем владельцам и менеджерам с привязанным Telegram
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: ['OWNER', 'MANAGER'] },
          telegramId: { not: null },
        },
      });

      for (const admin of admins) {
        if (admin.telegramId && admin.telegramId !== adminId) {
          try {
            await this.bot.sendMessage(admin.telegramId, message, { parse_mode: 'HTML' });
            this.logger.log(`Уведомление отправлено: ${admin.firstName} ${admin.lastName}`);
          } catch (error) {
            this.logger.error(`Ошибка отправки уведомления пользователю ${admin.id}:`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error('Ошибка отправки уведомлений администраторам:', error);
      throw error;
    }
  }
}
